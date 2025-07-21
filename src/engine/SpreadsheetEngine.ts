import { CellData, SpreadsheetData, } from './types';
import { createDependencyGraph } from './DependencyGraph';
import { evaluateFormula, parseFormula, validateFormula } from './FormulaParser';
import { GRID_ROWS, GRID_COLS, COLUMNS } from '@shared/constants';

export type SpreadsheetEngine = {
  set: (cellId: string, value: string | number | undefined, formula?: string) => boolean;
  get: (cellId: string) => CellData | undefined;
  getRawValue: (cellId: string) => string | number | undefined;
  getDisplayValue: (cellId: string) => string;
  getFormula: (cellId: string) => string | undefined;
  clear: () => void;
  clearCell: (cellId: string) => boolean;
  getAllCells: () => Record<string, CellData>;
  getStats: () => { totalCells: number; formulaCells: number; calculations: number };
  exportData: () => SpreadsheetData;
  importData: (data: SpreadsheetData) => void;
  onChange: (callback: () => void) => () => void;
};

export const getCellId = (row: number, col: number): string => {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
    throw new Error(`Invalid cell position: row ${row}, col ${col}`);
  }
  return `${COLUMNS[col]}${row + 1}`;
};

export const parseCellId = (cellId: string): { row: number; col: number } | null => {
  const match = cellId.match(/^([A-J])([1-5])$/);
  if (!match) return null;

  const [, col, row] = match;
  const colIndex = COLUMNS.indexOf(col);
  const rowIndex = parseInt(row) - 1;

  if (colIndex === -1 || rowIndex < 0 || rowIndex >= GRID_ROWS) {
    return null;
  }

  return { row: rowIndex, col: colIndex };
};

const isValidCellId = (cellId: string): boolean => {
  const match = cellId.match(/^([A-J])([1-5])$/);
  if (!match) return false;

  const [, col, row] = match;
  const colIndex = COLUMNS.indexOf(col);
  const rowIndex = parseInt(row) - 1;

  return colIndex >= 0 && colIndex < GRID_COLS && rowIndex >= 0 && rowIndex < GRID_ROWS;
};

export const createSpreadsheetEngine = (initialData?: SpreadsheetData): SpreadsheetEngine => {
  let data: SpreadsheetData = initialData || {
    cells: {},
    lastModified: new Date(),
    version: 1
  };

  const dependencyGraph = createDependencyGraph();
  const changeListeners = new Set<() => void>();

  const rebuildDependencyGraph = (): void => {
    dependencyGraph.clear();

    for (const [cellId, cell] of Object.entries(data.cells)) {
      if (cell.formula) {
        const { dependencies } = parseFormula(cell.formula);
        dependencies.forEach(dep => {
          dependencyGraph.addDependency(cellId, dep);
        });
      }
    }
  };

  const notifyChange = (): void => {
    changeListeners.forEach(callback => callback());
  };

  const getRawValue = (cellId: string): string | number | undefined => {
    const cell = data.cells[cellId];
    if (!cell) return undefined;

    if (cell.error && typeof cell.value === 'string' && cell.value.startsWith('#')) {
      return cell.value;
    }

    if (cell.error) {
      return cell.error;
    }

    return cell.value;
  };

  const recalculateDependents = (cellId: string): void => {
    const dependents = dependencyGraph.getAllDependents(cellId);

    for (const dependent of dependents) {
      const cell = data.cells[dependent];
      if (cell?.formula) {
        const result = evaluateFormula(cell.formula, getRawValue);
        cell.value = result.value;
        cell.error = result.error;
      }
    }
  };

  const set = (cellId: string, value: string | number | undefined, formula?: string): boolean => {
    if (!isValidCellId(cellId)) {
      return false;
    }

    const oldCell = data.cells[cellId];

    if (oldCell?.formula) {
      dependencyGraph.removeDependencies(cellId);
    }

    if (formula) {
      const formulaError = validateFormula(formula);
      if (formulaError) {
        data.cells[cellId] = {
          id: cellId,
          formula,
          error: formulaError.message,
          dependents: oldCell?.dependents || [],
          dependencies: []
        };
        notifyChange();
        return false;
      }

      const { dependencies } = parseFormula(formula);

      const circularError = dependencyGraph.checkCircularReference(cellId, dependencies);
      if (circularError) {
        data.cells[cellId] = {
          id: cellId,
          formula,
          error: circularError.message,
          dependents: oldCell?.dependents || [],
          dependencies: []
        };
        notifyChange();
        return false;
      }

      dependencies.forEach(dep => {
        dependencyGraph.addDependency(cellId, dep);
      });

      const result = evaluateFormula(formula, getRawValue);

      if (result.error) {
        data.cells[cellId] = {
          id: cellId,
          formula,
          value: result.value,
          error: result.error,
          dependents: oldCell?.dependents || [],
          dependencies
        };
        notifyChange();
        return false;
      }

      data.cells[cellId] = {
        id: cellId,
        formula,
        value: result.value,
        error: result.error,
        dependents: oldCell?.dependents || [],
        dependencies
      };
    } else {
      data.cells[cellId] = {
        id: cellId,
        value,
        dependents: oldCell?.dependents || [],
        dependencies: []
      };
    }

    data.lastModified = new Date();
    data.version++;

    recalculateDependents(cellId);
    notifyChange();

    return true;
  };

  const get = (cellId: string): CellData | undefined => {
    return data.cells[cellId];
  };

  const getDisplayValue = (cellId: string): string => {
    const cell = data.cells[cellId];
    if (!cell) return '';

    if (cell.error) {
      return cell.error;
    }

    if (cell.value === undefined || cell.value === null) {
      return '';
    }

    return cell.value.toString();
  };

  const getFormula = (cellId: string): string | undefined => {
    const cell = data.cells[cellId];
    return cell?.formula;
  };

  const clear = (): void => {
    data.cells = {};
    dependencyGraph.clear();
    data.lastModified = new Date();
    data.version++;
    notifyChange();
  };

  const clearCell = (cellId: string): boolean => {
    if (!isValidCellId(cellId)) {
      return false;
    }

    const cell = data.cells[cellId];
    if (!cell) {
      return true;
    }

    dependencyGraph.removeDependencies(cellId);
    delete data.cells[cellId];
    recalculateDependents(cellId);
    data.lastModified = new Date();
    data.version++;
    notifyChange();

    return true;
  };

  const getAllCells = (): Record<string, CellData> => {
    return { ...data.cells };
  };

  const getStats = (): { totalCells: number; formulaCells: number; calculations: number } => {
    const cells = Object.values(data.cells);
    const formulaCells = cells.filter(cell => cell.formula).length;
    const { totalDependencies } = dependencyGraph.getStats();

    return {
      totalCells: cells.length,
      formulaCells,
      calculations: totalDependencies
    };
  };

  const exportData = (): SpreadsheetData => {
    return {
      cells: { ...data.cells },
      lastModified: data.lastModified,
      version: data.version
    };
  };

  const importData = (newData: SpreadsheetData): void => {
    data = {
      cells: { ...newData.cells },
      lastModified: newData.lastModified,
      version: newData.version
    };
    rebuildDependencyGraph();
    notifyChange();
  };

  const onChange = (callback: () => void): () => void => {
    changeListeners.add(callback);
    return () => changeListeners.delete(callback);
  };

  rebuildDependencyGraph();

  return {
    set,
    get,
    getRawValue,
    getDisplayValue,
    getFormula,
    clear,
    clearCell,
    getAllCells,
    getStats,
    exportData,
    importData,
    onChange,
  };
};
