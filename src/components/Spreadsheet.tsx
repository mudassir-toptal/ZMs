import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Trash2, Download } from "lucide-react";
import { SpreadsheetGrid } from "./SpreadsheetGrid";
import { FormulaBar } from "./FormulaBar";
import { StatusBar } from "./StatusBar";
import { useSpreadsheet } from "../hooks/useSpreadsheet";

export const Spreadsheet = () => {
  const {
    selectedCell,
    isLoading,
    lastSaved,
    setSelectedCell,
    setCellValue,
    getCellDisplayValue,
    getCellFormula,
    clearAll,
    exportData,
    getStats,
    getAllCells,
  } = useSpreadsheet();

  const [status, setStatus] = useState<"ready" | "calculating" | "error">(
    "ready"
  );

  const handleCellSelect = useCallback(
    (cellId: string) => {
      setSelectedCell(cellId);
    },
    [setSelectedCell]
  );

  const handleCellEdit = useCallback(
    (cellId: string, value: string) => {
      setStatus("calculating");

      try {
        if (value.startsWith("=")) {
          const success = setCellValue(cellId, undefined, value);
          setStatus(success ? "ready" : "error");
        } else {
          const numValue = parseFloat(value);
          const cellValue = isNaN(numValue) ? value : numValue;
          const success = setCellValue(cellId, cellValue);
          setStatus(success ? "ready" : "error");
        }
      } catch (error) {
        setStatus("error");
      }
    },
    [setCellValue]
  );

  const handleApplyFormula = useCallback(
    (input: string) => {
      handleCellEdit(selectedCell, input);
    },
    [selectedCell, handleCellEdit]
  );

  const handleClearAll = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      clearAll();
    }
  }, [clearAll]);

  const handleExport = useCallback(() => {
    exportData();
  }, [exportData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-lg border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-700 font-medium text-lg">
            Loading Zingage Mini Spreadsheet...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Preparing your intelligent workspace
          </p>
        </div>
      </div>
    );
  }

  const displayValue = getCellDisplayValue(selectedCell);
  const formula = getCellFormula(selectedCell);
  const stats = getStats();
  const allCells = getAllCells();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Zingage Mini Spreadsheet
                </h1>
                <p className="text-xs text-gray-500">
                  Smart and complex formula machine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleClearAll}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                <span className="font-mono font-medium text-blue-700">
                  {selectedCell}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50/50">
            <FormulaBar
              selectedCell={selectedCell}
              cellValue={displayValue}
              cellFormula={formula}
              onApplyFormula={handleApplyFormula}
            />
          </div>

          <SpreadsheetGrid
            cells={allCells}
            selectedCell={selectedCell}
            onCellSelect={handleCellSelect}
            onCellEdit={handleCellEdit}
            getCellDisplayValue={getCellDisplayValue}
          />
        </div>

        <StatusBar stats={stats} lastSaved={lastSaved} status={status} />
      </div>
    </div>
  );
};
