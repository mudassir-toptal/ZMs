import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

type FormulaBarProps = {
  selectedCell: string;
  cellValue: string;
  cellFormula?: string;
  onApplyFormula: (formula: string) => void;
};

export const FormulaBar = ({
  selectedCell,
  cellValue,
  cellFormula,
  onApplyFormula,
}: FormulaBarProps) => {
  const [formulaInput, setFormulaInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (cellFormula) {
      setFormulaInput(cellFormula);
    } else {
      setFormulaInput(cellValue);
    }
  }, [cellValue, cellFormula, selectedCell]);

  const handleApply = useCallback(() => {
    onApplyFormula(formulaInput);
    setIsEditing(false);
  }, [formulaInput, onApplyFormula]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleApply();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        if (cellFormula) {
          setFormulaInput(cellFormula);
        } else {
          setFormulaInput(cellValue);
        }
      }
    },
    [handleApply, cellFormula, cellValue]
  );

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-500 font-mono min-w-[40px]">
          {selectedCell}
        </div>

        <div className="flex-1 flex items-center gap-2">
          <Input
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            placeholder="Enter value or formula (e.g., =A1+B1)"
            className="flex-1 text-sm border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 rounded-lg"
          />

          <Button
            onClick={handleApply}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-lg"
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-2 text-xs text-gray-500 bg-blue-50/50 p-2 rounded border border-blue-100">
          <span className="font-medium text-blue-700">Tip:</span> Use formulas
          like =SUM(A1:A5), =A1+B1, or =AVERAGE(B1:B10)
        </div>
      )}
    </div>
  );
};
