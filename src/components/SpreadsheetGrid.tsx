import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { COLUMNS, GRID_ROWS } from "@shared/constants";
import { CellData } from "../engine/types";
import {
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Calculator,
} from "lucide-react";

type SpreadsheetGridProps = {
  cells: Record<string, CellData>;
  selectedCell: string;
  onCellSelect: (cellId: string) => void;
  onCellEdit: (cellId: string, value: string) => void;
  getCellDisplayValue: (cellId: string) => string;
};

export const SpreadsheetGrid = ({
  cells,
  selectedCell,
  onCellSelect,
  onCellEdit,
  getCellDisplayValue,
}: SpreadsheetGridProps) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleCellClick = useCallback(
    (cellId: string) => {
      if (editingCell) {
        handleSaveEdit();
      }
      onCellSelect(cellId);
    },
    [editingCell, onCellSelect]
  );

  const handleCellDoubleClick = useCallback(
    (cellId: string) => {
      const cell = cells[cellId];
      const currentValue = cell?.formula || cell?.value?.toString() || "";
      setEditingCell(cellId);
      setEditValue(currentValue);
    },
    [cells]
  );

  const handleSaveEdit = useCallback(() => {
    if (editingCell) {
      onCellEdit(editingCell, editValue);
      setEditingCell(null);
      setEditValue("");
    }
  }, [editingCell, editValue, onCellEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleArrowKeys = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) {
        return;
      }

      const currentPos = selectedCell.match(/([A-J])([1-5])/);
      if (!currentPos) {
        return;
      }

      const [, col, row] = currentPos;
      const colIndex = COLUMNS.indexOf(col);
      const rowIndex = parseInt(row) - 1;

      let newColIndex = colIndex;
      let newRowIndex = rowIndex;

      switch (e.key) {
        case "ArrowUp":
          newRowIndex = Math.max(0, rowIndex - 1);
          break;
        case "ArrowDown":
          newRowIndex = Math.min(GRID_ROWS - 1, rowIndex + 1);
          break;
        case "ArrowLeft":
          newColIndex = Math.max(0, colIndex - 1);
          break;
        case "ArrowRight":
          newColIndex = Math.min(COLUMNS.length - 1, colIndex + 1);
          break;
        default:
          return;
      }

      if (newColIndex !== colIndex || newRowIndex !== rowIndex) {
        e.preventDefault();
        const newCellId = `${COLUMNS[newColIndex]}${newRowIndex + 1}`;
        onCellSelect(newCellId);
      }
    },
    [selectedCell, editingCell, onCellSelect]
  );

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        handleArrowKeys(e as any);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleArrowKeys]);

  const getCellIcon = (cell: CellData) => {
    if (cell.error) {
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    } else if (cell.formula) {
      return <Calculator className="w-3 h-3 text-blue-500" />;
    } else if (cell.value !== undefined) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    return null;
  };

  const getCellClasses = (cellId: string, cell?: CellData) => {
    const isSelected = cellId === selectedCell;
    const isEditing = cellId === editingCell;
    const hasError = cell?.error;
    const hasFormula = cell?.formula;

    return cn(
      "w-20 h-12 border-r border-slate-200/60 relative group transition-all duration-200",
      {
        "bg-gradient-to-br from-blue-100 to-indigo-200/80 border-2 border-blue-400 shadow-md":
          isSelected && !isEditing,
        "bg-gradient-to-br from-red-100 to-rose-200/80 border-2 border-red-400 shadow-md":
          hasError,
        "bg-gradient-to-br from-emerald-100 to-green-200/80 border-2 border-emerald-400 shadow-md":
          hasFormula && !hasError,
        "bg-white/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50/30":
          !isSelected && !hasError && !hasFormula,
      }
    );
  };

  const renderCell = (rowIndex: number, colIndex: number) => {
    const cellId = `${COLUMNS[colIndex]}${rowIndex + 1}`;
    const cell = cells[cellId];
    const displayValue = getCellDisplayValue(cellId);
    const isEditing = editingCell === cellId;

    return (
      <div key={cellId} className={getCellClasses(cellId, cell)}>
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            className="w-full h-full px-2 text-sm font-mono border-none outline-none bg-transparent"
          />
        ) : (
          <div
            className="w-full h-full flex items-center px-3 text-sm font-mono cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50/50 focus:bg-gradient-to-br focus:from-blue-100 focus:to-indigo-100/60 focus:ring-2 focus:ring-blue-400/50 focus:ring-inset transition-all duration-200 rounded-sm"
            onClick={() => handleCellClick(cellId)}
            onDoubleClick={() => handleCellDoubleClick(cellId)}
            tabIndex={0}
          >
            <span className="truncate">{displayValue}</span>
          </div>
        )}
        {cell && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
            {getCellIcon(cell)}
          </div>
        )}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300/30 pointer-events-none rounded-sm" />
      </div>
    );
  };

  return (
    <div className="overflow-auto max-h-[600px]">
      <div className="relative">
        <div className="flex sticky top-0 z-10 bg-gradient-to-r from-slate-100 to-blue-100/50 border-b border-slate-200/60 shadow-sm">
          <div className="w-12 h-10 border-r border-slate-200/60 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </div>
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="w-20 h-10 border-r border-slate-200/60 flex items-center justify-center text-sm font-bold text-slate-700 bg-gradient-to-b from-slate-50 to-blue-50/30 hover:bg-gradient-to-b hover:from-blue-50 hover:to-blue-100/50 transition-all duration-200"
            >
              {col}
            </div>
          ))}
        </div>

        {Array.from({ length: GRID_ROWS }, (_, rowIndex) => (
          <div key={rowIndex} className="flex border-b border-slate-200/60">
            <div className="w-12 h-12 border-r border-slate-200/60 flex items-center justify-center text-sm font-bold text-slate-700 bg-gradient-to-r from-slate-100 to-blue-100/30 hover:bg-gradient-to-r hover:from-blue-100/50 hover:to-blue-200/40 transition-all duration-200">
              {rowIndex + 1}
            </div>

            {Array.from({ length: COLUMNS.length }, (_, colIndex) =>
              renderCell(rowIndex, colIndex)
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
