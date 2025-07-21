import { SpreadsheetError } from './types';

export type DependencyGraph = {
	addDependency: (dependent: string, dependency: string) => void;
	removeDependencies: (cell: string) => void;
	getDependencies: (cell: string) => string[];
	getDependents: (cell: string) => string[];
	checkCircularReference: (cell: string, dependencies: string[]) => SpreadsheetError | null;
	getAllDependents: (cell: string) => string[];
	clear: () => void;
	getStats: () => { totalDependencies: number; totalCells: number };
};

export const createDependencyGraph = (): DependencyGraph => {
	const dependencies = new Map<string, Set<string>>();
	const dependents = new Map<string, Set<string>>();

	const addDependency = (dependent: string, dependency: string): void => {
		if (!dependencies.has(dependent)) {
			dependencies.set(dependent, new Set());
		}
		if (!dependents.has(dependency)) {
			dependents.set(dependency, new Set());
		}

		dependencies.get(dependent)!.add(dependency);
		dependents.get(dependency)!.add(dependent);
	};

	const removeDependencies = (cell: string): void => {
		const deps = dependencies.get(cell);
		if (deps) {
			deps.forEach(dep => {
				const cellDependents = dependents.get(dep);
				if (cellDependents) {
					cellDependents.delete(cell);
				}
			});
			dependencies.delete(cell);
		}
	};

	const getDependencies = (cell: string): string[] => {
		return Array.from(dependencies.get(cell) || []);
	};

	const getDependents = (cell: string): string[] => {
		return Array.from(dependents.get(cell) || []);
	};

	const checkCircularReference = (
		cell: string,
		cellDependencies: string[]
	): SpreadsheetError | null => {
		const tempGraph = new Map(dependencies);
		tempGraph.set(cell, new Set(cellDependencies));

		const visited = new Set<string>();
		const recursionStack = new Set<string>();
		const path: string[] = [];

		const hasCycle = (node: string): boolean => {
			if (recursionStack.has(node)) {
				return true;
			}

			if (visited.has(node)) {
				return false;
			}

			visited.add(node);
			recursionStack.add(node);
			path.push(node);

			const deps = tempGraph.get(node);
			if (deps) {
				for (const dep of deps) {
					if (hasCycle(dep)) {
						return true;
					}
				}
			}

			recursionStack.delete(node);
			path.pop();
			return false;
		};

		if (hasCycle(cell)) {
			const cycleStart = path.indexOf(cell);
			const cycle = path.slice(cycleStart).concat(cell);
			return {
				type: 'circular',
				message: `Circular reference detected: ${cycle.join(' → ')}`,
				chain: cycle,
			};
		}

		return null;
	};

	const getAllDependents = (cell: string): string[] => {
		const visited = new Set<string>();
		const result: string[] = [];

		const collectDependents = (currentCell: string) => {
			if (visited.has(currentCell)) return;
			visited.add(currentCell);

			const directDependents = getDependents(currentCell);
			for (const dependent of directDependents) {
				result.push(dependent);
				collectDependents(dependent);
			}
		};

		collectDependents(cell);
		return result;
	};

	const clear = (): void => {
		dependencies.clear();
		dependents.clear();
	};

	const getStats = (): { totalDependencies: number; totalCells: number } => {
		return {
			totalDependencies: Array.from(dependencies.values()).reduce(
				(sum, deps) => sum + deps.size,
				0
			),
			totalCells: dependencies.size,
		};
	};

	return {
		addDependency,
		removeDependencies,
		getDependencies,
		getDependents,
		checkCircularReference,
		getAllDependents,
		clear,
		getStats,
	};
};
