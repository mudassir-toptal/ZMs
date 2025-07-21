import { extractCellReferences, isValidCellReference, parseFormula, evaluateFormula, validateFormula } from '../src/engine/FormulaParser';

describe('FormulaParser', () => {
  describe('Cell Reference Extraction', () => {
    test('should extract single cell reference', () => {
      const refs = extractCellReferences('=A1');
      expect(refs).toEqual(['A1']);
    });

    test('should extract multiple cell references', () => {
      const refs = extractCellReferences('=A1+B2');
      expect(refs).toEqual(['A1', 'B2']);
    });

    test('should extract duplicate cell references only once', () => {
      const refs = extractCellReferences('=A1+A1');
      expect(refs).toEqual(['A1']);
    });

    test('should handle complex formulas', () => {
      const refs = extractCellReferences('=(A1+B2)*C3/D4');
      expect(refs).toEqual(['A1', 'B2', 'C3', 'D4']);
    });

    test('should return empty array for no references', () => {
      const refs = extractCellReferences('=10+20');
      expect(refs).toEqual([]);
    });
  });

  describe('Cell Reference Validation', () => {
    test('should validate correct cell references', () => {
      expect(isValidCellReference('A1')).toBe(true);
      expect(isValidCellReference('J5')).toBe(true);
      expect(isValidCellReference('E3')).toBe(true);
    });

    test('should reject invalid cell references', () => {
      expect(isValidCellReference('Z1')).toBe(false);
      expect(isValidCellReference('A0')).toBe(false);
      expect(isValidCellReference('A6')).toBe(false);
      expect(isValidCellReference('AA1')).toBe(false);
      expect(isValidCellReference('1A')).toBe(false);
    });
  });

  describe('Formula Parsing', () => {
    test('should parse simple formulas', () => {
      const result = parseFormula('=A1+B1');
      expect(result.dependencies).toEqual(['A1', 'B1']);
    });

    test('should parse non-formulas', () => {
      const result = parseFormula('Hello');
      expect(result.dependencies).toEqual([]);
      expect(result.tokens).toEqual(['Hello']);
    });

    test('should handle empty formulas', () => {
      const result = parseFormula('=');
      expect(result.dependencies).toEqual([]);
    });
  });

  describe('Formula Evaluation', () => {
    const getCellValue = (cellId: string) => {
      const values: Record<string, number> = {
        'A1': 10,
        'B1': 20,
        'C1': 5,
        'D1': 0
      };
      return values[cellId];
    };

    test('should evaluate simple addition', () => {
      const result = evaluateFormula('=A1+B1', getCellValue);
      expect(result.value).toBe(30);
      expect(result.dependencies).toEqual(['A1', 'B1']);
    });

    test('should evaluate complex expressions', () => {
      const result = evaluateFormula('=(A1+B1)*C1', getCellValue);
      expect(result.value).toBe(150);
      expect(result.dependencies).toEqual(['A1', 'B1', 'C1']);
    });

    test('should handle division by zero', () => {
      const result = evaluateFormula('=A1/D1', getCellValue);
      expect(result.value).toBe('#NUM!');
    });

    test('should handle missing cell values', () => {
      const result = evaluateFormula('=A1+E1', getCellValue);
      expect(result.value).toBe(10);
    });

    test('should handle non-formulas', () => {
      const result = evaluateFormula('Hello', getCellValue);
      expect(result.value).toBe('Hello');
      expect(result.dependencies).toEqual([]);
    });

    test('should handle string values in formulas', () => {
      const getStringValue = (cellId: string) => {
        if (cellId === 'A1') return 'Hello';
        return 10;
      };

      const result = evaluateFormula('=A1+B1', getStringValue);
      expect(result.value).toBe('#VALUE!');
    });
  });

  describe('Formula Validation', () => {
    test('should validate correct formulas', () => {
      const result = validateFormula('=A1+B1');
      expect(result).toBeNull();
    });

    test('should detect unbalanced parentheses', () => {
      const result = validateFormula('=(A1+B1');
      expect(result?.type).toBe('formula');
      expect(result?.message).toContain('parenthesis');
    });

    test('should detect invalid cell references', () => {
      const result = validateFormula('=A1+Z9');
      expect(result?.type).toBe('reference');
      expect(result?.message).toContain('Invalid cell reference');
    });

    test('should handle non-formulas', () => {
      const result = validateFormula('Hello');
      expect(result).toBeNull();
    });
  });

  describe('Function Support', () => {
    const mockGetCellValue = (cellId: string) => {
      const values: Record<string, number> = {
        'A1': 10,
        'A2': 20,
        'A3': 30,
        'A4': 40,
        'B1': 5,
        'B2': 15
      };
      return values[cellId];
    };

    test('should evaluate SUM with range', () => {
      const result = evaluateFormula('=SUM(A1:A3)', mockGetCellValue);
      expect(result.value).toBe(60);
      expect(result.dependencies.sort()).toEqual(['A1', 'A2', 'A3']);
    });

    test('should evaluate SUM with individual cells', () => {
      const result = evaluateFormula('=SUM(A1,B1)', mockGetCellValue);
      expect(result.value).toBe(15);
      expect(result.dependencies).toEqual(['A1', 'B1']);
    });

    test('should evaluate AVERAGE with range', () => {
      const result = evaluateFormula('=AVERAGE(A1:A3)', mockGetCellValue);
      expect(result.value).toBe(20);
    });

    test('should evaluate MIN with range', () => {
      const result = evaluateFormula('=MIN(A1:A3)', mockGetCellValue);
      expect(result.value).toBe(10);
    });

    test('should evaluate MAX with range', () => {
      const result = evaluateFormula('=MAX(A1:A3)', mockGetCellValue);
      expect(result.value).toBe(30);
    });

    test('should evaluate COUNT with range', () => {
      const result = evaluateFormula('=COUNT(A1:A3)', mockGetCellValue);
      expect(result.value).toBe(3);
    });

    test('should handle unknown function', () => {
      const result = evaluateFormula('=UNKNOWN(A1:A3)', mockGetCellValue);
      expect(result.value).toBe('#NAME!'); // Unknown functions return #NAME!
    });
  });
});
