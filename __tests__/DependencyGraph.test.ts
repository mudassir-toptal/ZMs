import { DependencyGraph, createDependencyGraph } from '../src/engine/DependencyGraph';

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = createDependencyGraph();
  });

  describe('Basic Operations', () => {
    test('should add dependencies', () => {
      graph.addDependency('A1', 'B1');
      expect(graph.getDependencies('A1')).toEqual(['B1']);
      expect(graph.getDependents('B1')).toEqual(['A1']);
    });

    test('should handle multiple dependencies', () => {
      graph.addDependency('A1', 'B1');
      graph.addDependency('A1', 'C1');
      expect(graph.getDependencies('A1')).toEqual(['B1', 'C1']);
    });

    test('should handle multiple dependents', () => {
      graph.addDependency('A1', 'C1');
      graph.addDependency('B1', 'C1');
      expect(graph.getDependents('C1')).toEqual(['A1', 'B1']);
    });

    test('should remove dependencies', () => {
      graph.addDependency('A1', 'B1');
      graph.addDependency('A1', 'C1');
      graph.removeDependencies('A1');

      expect(graph.getDependencies('A1')).toEqual([]);
      expect(graph.getDependents('B1')).toEqual([]);
      expect(graph.getDependents('C1')).toEqual([]);
    });

    test('should handle empty dependencies', () => {
      expect(graph.getDependencies('A1')).toEqual([]);
      expect(graph.getDependents('A1')).toEqual([]);
    });
  });

  describe('Circular Reference Detection', () => {
    test('should detect direct circular references', () => {
      const result = graph.checkCircularReference('A1', ['A1']);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('circular');
    });

    test('should detect indirect circular references', () => {
      graph.addDependency('A1', 'B1');
      graph.addDependency('B1', 'C1');

      const result = graph.checkCircularReference('C1', ['A1']);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('circular');
    });

    test('should not detect false positives', () => {
      graph.addDependency('A1', 'B1');
      graph.addDependency('B1', 'C1');

      const result = graph.checkCircularReference('D1', ['A1']);
      expect(result).toBeNull();
    });

    test('should handle complex circular references', () => {
      graph.addDependency('A1', 'B1');
      graph.addDependency('B1', 'C1');
      graph.addDependency('C1', 'D1');

      const result = graph.checkCircularReference('D1', ['A1']);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('circular');
    });
  });

  describe('Dependent Collection', () => {
    test('should collect all dependents', () => {
      graph.addDependency('A1', 'D1');
      graph.addDependency('B1', 'D1');
      graph.addDependency('C1', 'A1');

      const dependents = graph.getAllDependents('D1');
      expect(dependents).toContain('A1');
      expect(dependents).toContain('B1');
      expect(dependents).toContain('C1');
    });

    test('should handle chain dependencies', () => {
      graph.addDependency('A1', 'D1');
      graph.addDependency('B1', 'A1');
      graph.addDependency('C1', 'B1');

      const dependents = graph.getAllDependents('D1');
      expect(dependents).toEqual(['A1', 'B1', 'C1']);
    });

    test('should handle empty dependents', () => {
      const dependents = graph.getAllDependents('A1');
      expect(dependents).toEqual([]);
    });
  });

  describe('Graph Statistics', () => {
    test('should provide accurate stats', () => {
      graph.addDependency('A1', 'B1');
      graph.addDependency('A1', 'C1');
      graph.addDependency('B1', 'C1');

      const stats = graph.getStats();
      expect(stats.totalCells).toBe(2);
      expect(stats.totalDependencies).toBe(3);
    });

    test('should handle empty graph', () => {
      const stats = graph.getStats();
      expect(stats.totalCells).toBe(0);
      expect(stats.totalDependencies).toBe(0);
    });
  });

  describe('Graph Clearing', () => {
    test('should clear all dependencies', () => {
      graph.addDependency('A1', 'B1');
      graph.addDependency('C1', 'D1');

      graph.clear();

      expect(graph.getDependencies('A1')).toEqual([]);
      expect(graph.getDependents('B1')).toEqual([]);
      expect(graph.getDependencies('C1')).toEqual([]);
      expect(graph.getDependents('D1')).toEqual([]);
    });
  });
});
