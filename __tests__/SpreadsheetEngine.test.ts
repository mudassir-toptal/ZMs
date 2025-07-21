import { SpreadsheetEngine, createSpreadsheetEngine } from '../src/engine/SpreadsheetEngine';

describe('SpreadsheetEngine', () => {
  let engine: SpreadsheetEngine;

  beforeEach(() => {
    engine = createSpreadsheetEngine();
  });

  describe('Basic Operations', () => {
    test('should set and get cell values', () => {
      engine.set('A1', 100);
      expect(engine.getRawValue('A1')).toBe(100);
      expect(engine.getDisplayValue('A1')).toBe('100');
    });

    test('should set and get string values', () => {
      engine.set('A1', 'Hello');
      expect(engine.getRawValue('A1')).toBe('Hello');
      expect(engine.getDisplayValue('A1')).toBe('Hello');
    });

    test('should handle undefined values', () => {
      expect(engine.getRawValue('A1')).toBeUndefined();
      expect(engine.getDisplayValue('A1')).toBe('');
    });

    test('should clear cells', () => {
      engine.set('A1', 100);
      engine.clearCell('A1');
      expect(engine.getRawValue('A1')).toBeUndefined();
    });

    test('should clear all cells', () => {
      engine.set('A1', 100);
      engine.set('B1', 200);
      engine.clear();
      expect(engine.getRawValue('A1')).toBeUndefined();
      expect(engine.getRawValue('B1')).toBeUndefined();
    });
  });

  describe('Formula Evaluation', () => {
    test('should evaluate simple formulas', () => {
      engine.set('A1', 100);
      engine.set('B1', 200);
      engine.set('C1', undefined, '=A1+B1');
      expect(engine.getRawValue('C1')).toBe(300);
    });

    test('should evaluate complex formulas', () => {
      engine.set('A1', 10);
      engine.set('B1', 5);
      engine.set('C1', undefined, '=A1*B1+10');
      expect(engine.getRawValue('C1')).toBe(60);
    });

    test('should handle formulas with parentheses', () => {
      engine.set('A1', 10);
      engine.set('B1', 5);
      engine.set('C1', undefined, '=(A1+B1)*2');
      expect(engine.getRawValue('C1')).toBe(30);
    });

    test('should handle division', () => {
      engine.set('A1', 100);
      engine.set('B1', 4);
      engine.set('C1', undefined, '=A1/B1');
      expect(engine.getRawValue('C1')).toBe(25);
    });

    test('should handle non-numeric values in formulas', () => {
      engine.set('A1', 'Hello');
      engine.set('B1', 100);
      engine.set('C1', undefined, '=A1+B1');
      expect(engine.getRawValue('C1')).toBe('#VALUE!');
    });
  });

  describe('Dependency Management', () => {
    test('should update dependent cells when source changes', () => {
      engine.set('A1', 100);
      engine.set('B1', undefined, '=A1*2');
      expect(engine.getRawValue('B1')).toBe(200);

      engine.set('A1', 50);
      expect(engine.getRawValue('B1')).toBe(100);
    });

    test('should handle chain dependencies', () => {
      engine.set('A1', 10);
      engine.set('B1', undefined, '=A1*2');
      engine.set('C1', undefined, '=B1+5');
      expect(engine.getRawValue('C1')).toBe(25);

      engine.set('A1', 5);
      expect(engine.getRawValue('B1')).toBe(10);
      expect(engine.getRawValue('C1')).toBe(15);
    });

    test('should handle multiple dependencies', () => {
      engine.set('A1', 10);
      engine.set('A2', 20);
      engine.set('B1', undefined, '=A1+A2');
      expect(engine.getRawValue('B1')).toBe(30);

      engine.set('A1', 15);
      expect(engine.getRawValue('B1')).toBe(35);

      engine.set('A2', 25);
      expect(engine.getRawValue('B1')).toBe(40);
    });
  });

  describe('Circular Reference Detection', () => {
    test('should detect direct circular references', () => {
      const result = engine.set('A1', undefined, '=A1+1');
      expect(result).toBe(false);

      const cell = engine.get('A1');
      expect(cell?.error).toContain('Circular reference');
    });

    test('should detect indirect circular references', () => {
      engine.set('A1', undefined, '=B1');
      const result = engine.set('B1', undefined, '=A1');
      expect(result).toBe(false);

      const cell = engine.get('B1');
      expect(cell?.error).toContain('Circular reference');
    });

    test('should detect complex circular references', () => {
      engine.set('A1', undefined, '=B1');
      engine.set('B1', undefined, '=C1');
      const result = engine.set('C1', undefined, '=A1');
      expect(result).toBe(false);

      const cell = engine.get('C1');
      expect(cell?.error).toContain('Circular reference');
    });

    test('should allow valid references after circular reference is removed', () => {
      engine.set('A1', undefined, '=B1');
      engine.set('B1', undefined, '=A1');

      engine.set('B1', 100);
      expect(engine.getRawValue('A1')).toBe(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid cell references', () => {
      const result = engine.set('A1', undefined, '=Z9+1');
      expect(result).toBe(false);

      const cell = engine.get('A1');
      expect(cell?.error).toContain('Invalid cell reference');
    });

    test('should handle invalid formulas', () => {
      const result = engine.set('A1', undefined, '=1++2');
      expect(result).toBe(false);

      const cell = engine.get('A1');
      expect(cell?.error).toBeDefined();
    });

    test('should handle division by zero', () => {
      engine.set('A1', 10);
      engine.set('B1', 0);
      engine.set('C1', undefined, '=A1/B1');
      expect(engine.getRawValue('C1')).toBe('#NUM!');
    });

    test('should handle unbalanced parentheses', () => {
      const result = engine.set('A1', undefined, '=(1+2');
      expect(result).toBe(false);

      const cell = engine.get('A1');
      expect(cell?.error).toContain('parenthesis');
    });
  });

  describe('Cell Validation', () => {
    test('should reject invalid cell IDs', () => {
      expect(engine.set('Z1', 100)).toBe(false);
      expect(engine.set('A0', 100)).toBe(false);
      expect(engine.set('A6', 100)).toBe(false);
      expect(engine.set('', 100)).toBe(false);
    });

    test('should accept valid cell IDs', () => {
      expect(engine.set('A1', 100)).toBe(true);
      expect(engine.set('J5', 100)).toBe(true);
    });
  });

  describe('Statistics', () => {
    test('should provide accurate stats', () => {
      engine.set('A1', 100);
      engine.set('B1', undefined, '=A1*2');
      engine.set('C1', 'Hello');

      const stats = engine.getStats();
      expect(stats.totalCells).toBe(3);
      expect(stats.formulaCells).toBe(1);
      expect(stats.calculations).toBe(1);
    });
  });

  describe('Data Import/Export', () => {
    test('should export and import data correctly', () => {
      engine.set('A1', 100);
      engine.set('B1', undefined, '=A1*2');

      const exportedData = engine.exportData();
      const newEngine = createSpreadsheetEngine();
      newEngine.importData(exportedData);

      expect(newEngine.getRawValue('A1')).toBe(100);
      expect(newEngine.getRawValue('B1')).toBe(200);
      expect(newEngine.getFormula('B1')).toBe('=A1*2');
    });
  });
});
