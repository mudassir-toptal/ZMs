import { EvaluationResult, SpreadsheetError } from './types';

const CELL_REGEX = /([A-Z])([0-9]+)/g;
const RANGE_REGEX = /([A-Z][0-9]+):([A-Z][0-9]+)/g;
const FUNCTION_REGEX = /([A-Z]+)\s*\(/gi;
const OPERATORS = ['+', '-', '*', '/', '(', ')'];

export const extractCellReferences = (formula: string): string[] => {
  const cellRefs = new Set<string>();

  const cellMatches = formula.matchAll(CELL_REGEX);
  for (const match of cellMatches) {
    cellRefs.add(match[0]);
  }

  const rangeMatches = formula.matchAll(RANGE_REGEX);
  for (const match of rangeMatches) {
    const [, start, end] = match;
    const rangeCells = expandRange(start, end);
    rangeCells.forEach(cell => cellRefs.add(cell));
  }

  return Array.from(cellRefs);
};

const expandRange = (start: string, end: string): string[] => {
  const startMatch = start.match(/([A-Z])([0-9]+)/);
  const endMatch = end.match(/([A-Z])([0-9]+)/);

  if (!startMatch || !endMatch) return [];

  const [, startCol, startRowStr] = startMatch;
  const [, endCol, endRowStr] = endMatch;
  const startRow = parseInt(startRowStr);
  const endRow = parseInt(endRowStr);

  const cells: string[] = [];

  if (startCol === endCol) {
    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
      cells.push(`${startCol}${row}`);
    }
  } else if (startRow === endRow) {
    const startColIndex = startCol.charCodeAt(0) - 65;
    const endColIndex = endCol.charCodeAt(0) - 65;
    for (let colIndex = Math.min(startColIndex, endColIndex); colIndex <= Math.max(startColIndex, endColIndex); colIndex++) {
      const col = String.fromCharCode(65 + colIndex);
      cells.push(`${col}${startRow}`);
    }
  }

  return cells;
};

export const isValidCellReference = (cellRef: string): boolean => {
  return /^[A-J][1-5]$/.test(cellRef);
};

const tokenize = (expression: string): string[] => {
  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (OPERATORS.includes(char)) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      tokens.push(char);
    } else if (char === ' ') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
};

export const parseFormula = (formula: string): { tokens: string[]; dependencies: string[] } => {
  if (!formula.startsWith('=')) {
    return { tokens: [formula], dependencies: [] };
  }

  const expression = formula.slice(1);
  const dependencies = extractCellReferences(expression);
  const tokens = tokenize(expression);

  return { tokens, dependencies };
};

const evaluateExpression = (expression: string): number | string => {
  try {
    if (/^[0-9+\-*/.() ]+$/.test(expression)) {
      const result = new Function('return ' + expression)();
      if (typeof result !== 'number' || !isFinite(result)) {
        return '#NUM!';
      }
      return Math.round(result * 1000000) / 1000000;
    }

    return '#VALUE!';
  } catch (error) {
    return '#ERROR!';
  }
};

const evaluateFunction = (
  functionName: string,
  args: number[]
): number | string => {
  switch (functionName.toUpperCase()) {
    case 'SUM':
      return args.reduce((sum, val) => sum + val, 0);
    case 'AVERAGE':
      return args.length > 0 ? args.reduce((sum, val) => sum + val, 0) / args.length : 0;
    case 'MIN':
      return args.length > 0 ? Math.min(...args) : 0;
    case 'MAX':
      return args.length > 0 ? Math.max(...args) : 0;
    case 'COUNT':
      return args.length;
    default:
      return '#NAME!';
  }
};

export const evaluateFormula = (
  formula: string,
  getCellValue: (cellId: string) => number | string | undefined
): EvaluationResult => {
  try {
    if (!formula.startsWith('=')) {
      return { value: formula, dependencies: [] };
    }

    const expression = formula.slice(1);
    const dependencies = extractCellReferences(expression);

    for (const dep of dependencies) {
      if (!isValidCellReference(dep)) {
        return {
          value: '#REF!',
          error: `Invalid cell reference: ${dep}`,
          dependencies: []
        };
      }
    }

    const functionMatches = Array.from(expression.matchAll(FUNCTION_REGEX));

    if (functionMatches.length > 0) {
      let processedExpression = expression;

      for (const match of functionMatches) {
        const functionName = match[1];
        const functionCall = match[0];

        const startIndex = match.index!;
        let parenCount = 0;
        let endIndex = startIndex + functionCall.length - 1;

        for (let i = endIndex; i < expression.length; i++) {
          if (expression[i] === '(') parenCount++;
          if (expression[i] === ')') {
            parenCount--;
            if (parenCount === 0) {
              endIndex = i;
              break;
            }
          }
        }

        const fullFunctionCall = expression.slice(startIndex, endIndex + 1);
        const argsString = expression.slice(startIndex + functionCall.length, endIndex);

        const args: number[] = [];

        const rangeMatches = Array.from(argsString.matchAll(RANGE_REGEX));
        for (const rangeMatch of rangeMatches) {
          const [, start, end] = rangeMatch;
          const rangeCells = expandRange(start, end);

          for (const cellId of rangeCells) {
            const cellValue = getCellValue(cellId);
            if (cellValue !== undefined && cellValue !== null) {
              const numValue = typeof cellValue === 'string' ? parseFloat(cellValue) : cellValue;
              if (!isNaN(numValue)) {
                args.push(numValue);
              }
            }
          }
        }

        let argsWithoutRanges = argsString;
        for (const rangeMatch of rangeMatches) {
          argsWithoutRanges = argsWithoutRanges.replace(rangeMatch[0], '');
        }

        const individualCells = Array.from(argsWithoutRanges.matchAll(CELL_REGEX));
        for (const cellMatch of individualCells) {
          const cellId = cellMatch[0];
          const cellValue = getCellValue(cellId);
          if (cellValue !== undefined && cellValue !== null) {
            const numValue = typeof cellValue === 'string' ? parseFloat(cellValue) : cellValue;
            if (!isNaN(numValue)) {
              args.push(numValue);
            }
          }
        }

        const result = evaluateFunction(functionName, args);

        processedExpression = processedExpression.replace(fullFunctionCall, result.toString());
      }

      if (processedExpression.startsWith('#')) {
        return {
          value: processedExpression,
          error: processedExpression,
          dependencies
        };
      }

      const finalResult = evaluateExpression(processedExpression);

      if (typeof finalResult === 'string' && finalResult.startsWith('#')) {
        return {
          value: finalResult,
          error: finalResult,
          dependencies
        };
      }

      return {
        value: finalResult,
        dependencies
      };
    }

    let processedExpression = expression;

    for (const cellRef of dependencies) {
      const cellValue = getCellValue(cellRef);

      if (cellValue === undefined || cellValue === null) {
        processedExpression = processedExpression.replace(
          new RegExp(cellRef, 'g'),
          '0'
        );
      } else if (typeof cellValue === 'string') {
        const numValue = parseFloat(cellValue);
        if (isNaN(numValue)) {
          return {
            value: '#VALUE!',
            error: `Non-numeric value in cell ${cellRef}: ${cellValue}`,
            dependencies
          };
        }
        processedExpression = processedExpression.replace(
          new RegExp(cellRef, 'g'),
          numValue.toString()
        );
      } else {
        processedExpression = processedExpression.replace(
          new RegExp(cellRef, 'g'),
          cellValue.toString()
        );
      }
    }

    const result = evaluateExpression(processedExpression);

    if (typeof result === 'string') {
      return {
        value: result,
        error: result.startsWith('#') ? result : undefined,
        dependencies
      };
    }

    return {
      value: result,
      dependencies
    };

  } catch (error) {
    return {
      value: '#ERROR!',
      error: error instanceof Error ? error.message : 'Unknown error',
      dependencies: []
    };
  }
};

export const validateFormula = (formula: string): SpreadsheetError | null => {
  if (!formula.startsWith('=')) {
    return null;
  }

  const expression = formula.slice(1);

  let parenCount = 0;
  for (const char of expression) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return {
        type: 'formula',
        message: 'Unmatched closing parenthesis'
      };
    }
  }

  if (parenCount !== 0) {
    return {
      type: 'formula',
      message: 'Unmatched opening parenthesis'
    };
  }

  const cellRefs = extractCellReferences(expression);
  for (const cellRef of cellRefs) {
    if (!isValidCellReference(cellRef)) {
      return {
        type: 'reference',
        message: `Invalid cell reference: ${cellRef}`,
        invalidRef: cellRef
      };
    }
  }

  return null;
};
