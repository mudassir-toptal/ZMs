export type CellData = {
  id: string;
  value?: string | number;
  formula?: string;
  error?: string;
  dependents: string[];
  dependencies: string[];
};

export type SpreadsheetData = {
  cells: Record<string, CellData>;
  lastModified: Date;
  version: number;
};

export type EvaluationResult = {
  value: string | number;
  error?: string;
  dependencies: string[];
};

export type CircularReferenceError = {
  type: 'circular';
  message: string;
  chain: string[];
};

export type FormulaError = {
  type: 'formula';
  message: string;
  position?: number;
};

export type ReferenceError = {
  type: 'reference';
  message: string;
  invalidRef: string;
};

export type SpreadsheetError = CircularReferenceError | FormulaError | ReferenceError;
