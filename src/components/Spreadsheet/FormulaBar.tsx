import React from 'react';
import { FunctionSquare } from 'lucide-react';

interface FormulaBarProps {
  selectedCell: string;
  formula: string;
  onFormulaChange: (value: string) => void;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({ selectedCell, formula, onFormulaChange }) => {
  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      className="bg-white border-b border-gray-300 h-9 flex items-center px-1 gap-1 shrink-0"
    >
      <div className="w-16 h-7 flex items-center justify-center text-xs font-medium border-r border-gray-200 text-gray-600 bg-gray-50">
        {selectedCell || ''}
      </div>
      <button 
        onClick={() => onFormulaChange('=SUM(')}
        className="flex items-center justify-center w-8 h-7 text-gray-500 hover:bg-gray-100 rounded transition-colors"
        title="Insert Function"
      >
        <FunctionSquare size={16} />
      </button>
      <div className="flex-1 h-7">
        <input 
          type="text" 
          inputMode="text"
          value={formula}
          onChange={(e) => onFormulaChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full h-full px-2 text-xs outline-none focus:ring-1 focus:ring-[#107c41]/30 border border-transparent focus:border-[#107c41] rounded touch-auto"
          placeholder="Enter formula or value"
        />
      </div>
    </div>
  );
};
