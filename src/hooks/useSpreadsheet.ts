import { useState, useEffect, useCallback } from 'react';
import { SpreadsheetEngine, createSpreadsheetEngine } from '../engine/SpreadsheetEngine';
import { SpreadsheetData } from '../engine/types';
import { useToast } from './use-toast';

const STORAGE_KEY = 'zingage-spreadsheet';

export const useSpreadsheet = () => {
  const [engine, setEngine] = useState<SpreadsheetEngine | null>(null);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      let initialData: SpreadsheetData | undefined;

      if (savedData) {
        const parsed = JSON.parse(savedData);
        initialData = {
          ...parsed,
          lastModified: new Date(parsed.lastModified)
        };
      }

      const newEngine = createSpreadsheetEngine(initialData);
      setEngine(newEngine);
      setLastSaved(initialData?.lastModified || null);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load spreadsheet data:', error);
      const newEngine = createSpreadsheetEngine();
      setEngine(newEngine);
      setIsLoading(false);
      toast({
        title: 'Error loading data',
        description: 'Starting with a fresh spreadsheet',
        variant: 'destructive'
      });
    }
  }, [toast]);


  const saveData = useCallback(() => {
    if (!engine) return;

    try {
      const data = engine.exportData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save spreadsheet data:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save your changes',
        variant: 'destructive'
      });
    }
  }, [engine, toast]);


  useEffect(() => {
    if (!engine) {
      return;
    }

    const unsubscribe = engine.onChange(() => {
      saveData();
    });

    return unsubscribe;
  }, [engine, saveData]);

  const setCellValue = useCallback((cellId: string, value: string | number | undefined, formula?: string) => {
    if (!engine) {
      return false;
    }

    const success = engine.set(cellId, value, formula);

    if (!success) {
      const cell = engine.get(cellId);
      if (cell?.error) {
        toast({
          title: 'Error updating cell',
          description: cell.error,
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Cell updated',
        description: `${cellId} updated successfully`,
        variant: 'default'
      });
    }

    return success;
  }, [engine, toast]);

  const getCellValue = useCallback((cellId: string) => {
    if (!engine) return undefined;
    return engine.get(cellId);
  }, [engine]);

  const getCellDisplayValue = useCallback((cellId: string) => {
    if (!engine) return '';
    return engine.getDisplayValue(cellId);
  }, [engine]);

  const getCellFormula = useCallback((cellId: string) => {
    if (!engine) return undefined;
    return engine.getFormula(cellId);
  }, [engine]);

  const clearAll = useCallback(() => {
    if (!engine) return;

    engine.clear();
    toast({
      title: 'Spreadsheet cleared',
      description: 'All data has been removed',
      variant: 'default'
    });
  }, [engine, toast]);

  const clearCell = useCallback((cellId: string) => {
    if (!engine) return false;

    const success = engine.clearCell(cellId);
    if (success) {
      toast({
        title: 'Cell cleared',
        description: `${cellId} has been cleared`,
        variant: 'default'
      });
    }
    return success;
  }, [engine, toast]);

  const exportData = useCallback(() => {
    if (!engine) return null;

    try {
      const data = engine.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spreadsheet-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'Spreadsheet data exported to file',
        variant: 'default'
      });

      return data;
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Could not export spreadsheet data',
        variant: 'destructive'
      });
      return null;
    }
  }, [engine, toast]);

  const getStats = useCallback(() => {
    if (!engine) return { totalCells: 0, formulaCells: 0, calculations: 0 };
    return engine.getStats();
  }, [engine]);

  const getAllCells = useCallback(() => {
    if (!engine) return {};
    return engine.getAllCells();
  }, [engine]);

  return {
    engine,
    selectedCell,
    setSelectedCell,
    isLoading,
    lastSaved,
    setCellValue,
    getCellValue,
    getCellDisplayValue,
    getCellFormula,
    clearAll,
    clearCell,
    exportData,
    getStats,
    getAllCells,
    saveData
  };
}
