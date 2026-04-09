import React, { useMemo } from 'react';
import { CellData } from '../../types';
import { colToNumber } from '../../utils/formulas';

interface StatusBarProps {
  cells: Record<string, CellData>;
  selectionRange: { start: string; end: string } | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ cells, selectionRange }) => {
  const stats = useMemo(() => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    
    const sCol = colToNumber(start.match(/[A-Z]+/)?.[0] || 'A');
    const sRow = parseInt(start.match(/[0-9]+/)?.[0] || '1');
    const eCol = colToNumber(end.match(/[A-Z]+/)?.[0] || 'A');
    const eRow = parseInt(end.match(/[0-9]+/)?.[0] || '1');

    const minCol = Math.min(sCol, eCol);
    const maxCol = Math.max(sCol, eCol);
    const minRow = Math.min(sRow, eRow);
    const maxRow = Math.max(sRow, eRow);

    const rowCount = maxRow - minRow + 1;
    const colCount = maxCol - minCol + 1;

    const values: number[] = [];
    let count = 0;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const id = `${String.fromCharCode(64 + c)}${r}`;
        const val = cells[id]?.value;
        if (val !== undefined && val !== '') {
          count++;
          if (!isNaN(Number(val))) {
            values.push(Number(val));
          }
        }
      }
    }

    if (values.length === 0) return { rowCount, colCount, count };

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      rowCount,
      colCount,
      count,
      sum,
      avg
    };
  }, [cells, selectionRange]);

  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      className="h-6 bg-[#f3f2f1] border-t border-gray-300 flex items-center justify-between px-4 text-[10px] text-gray-600 shrink-0 select-none"
    >
      <div className="flex items-center gap-4">
        <span className="text-[#107c41] font-medium">Ready</span>
        {stats && (
          <span className="bg-gray-200 px-2 rounded">{stats.rowCount}R x {stats.colCount}C</span>
        )}
      </div>
      
      {stats && stats.count > 0 && (
        <div className="flex items-center gap-4">
          {stats.avg !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Average:</span>
              <span>{stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="font-medium">Count:</span>
            <span>{stats.count}</span>
          </div>
          {stats.sum !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Sum:</span>
              <span>{stats.sum.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
