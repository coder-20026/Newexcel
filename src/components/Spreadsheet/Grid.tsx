import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CellData, MergedRange, PrintArea } from '../../types';
import { numberToCol, colToNumber } from '../../utils/formulas';

interface GridProps {
  cells: Record<string, CellData>;
  mergedCells: MergedRange[];
  selectedCell: string | null;
  selectionRange: { start: string; end: string } | null;
  onCellSelect: (cellId: string) => void;
  onRangeSelect: (start: string, end: string) => void;
  onCellUpdate: (cellId: string, value: string) => void;
  rowHeights: Record<number, number>;
  colWidths: Record<number, number>;
  onSizeChange: (type: 'rowHeight' | 'colWidth', index: number, value: number) => void;
  showGridlines: boolean;
  showHeadings: boolean;
  printArea?: PrintArea | null;
}

const ROWS = 100;
const COLS = 26;

// Excel Conversion Constants
const ROW_PT_TO_PX = 1.33;
const COL_UNIT_TO_PX = 7;
// In web, CSS pixels are roughly equivalent to "dp" (density independent).
// We'll use a fixed density of 1 for consistent logical sizing across devices,
// as browsers already handle physical pixel scaling.
const DENSITY = 1; 

const DEFAULT_ROW_HEIGHT = (15 * ROW_PT_TO_PX) / DENSITY; // 15pt -> ~20px
const DEFAULT_COL_WIDTH = (8.43 * COL_UNIT_TO_PX) / DENSITY; // 8.43 units -> ~59px

export const Grid: React.FC<GridProps> = ({ 
  cells, 
  mergedCells,
  selectedCell, 
  selectionRange,
  onCellSelect, 
  onRangeSelect,
  onCellUpdate,
  rowHeights,
  colWidths,
  onSizeChange,
  showGridlines,
  showHeadings,
  printArea
}) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [resizing, setResizing] = useState<{ type: 'rowHeight' | 'colWidth'; index: number; startPos: number; startSize: number } | null>(null);
  const dragStartCell = useRef<string | null>(null);
  const lastTap = useRef<{ id: string; time: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (cellId: string, e: React.PointerEvent) => {
    // Only handle primary button (left click) or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    setIsDragging(true);
    dragStartCell.current = cellId;
    onCellSelect(cellId);
    onRangeSelect(cellId, cellId);
  };

  const handleMouseEnter = (cellId: string) => {
    if (isDragging && dragStartCell.current) {
      onRangeSelect(dragStartCell.current, cellId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (resizing) {
      const delta = resizing.type === 'rowHeight' ? e.clientY - resizing.startPos : e.clientX - resizing.startPos;
      let newSize = resizing.startSize + delta;
      
      // Enforce limits (Excel max: 409.5 pt row, 255 units col)
      if (resizing.type === 'rowHeight') {
        newSize = Math.min(545, Math.max(0, newSize));
      } else {
        newSize = Math.min(1785, Math.max(0, newSize));
      }
      
      onSizeChange(resizing.type, resizing.index, newSize);
      return;
    }

    if (!isDragging || !dragStartCell.current) return;
    e.preventDefault();
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const cellId = element?.closest('[data-cell-id]')?.getAttribute('data-cell-id');
    if (cellId) onRangeSelect(dragStartCell.current, cellId);
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      setIsFilling(false);
      setResizing(null);
      dragStartCell.current = null;
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  const handleFillHandlePointerDown = (e: React.PointerEvent, cellId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setIsFilling(true);
    dragStartCell.current = cellId;
  };

  const handleResizerPointerDown = (e: React.PointerEvent, type: 'rowHeight' | 'colWidth', index: number) => {
    e.stopPropagation();
    const startPos = type === 'rowHeight' ? e.clientY : e.clientX;
    const startSize = type === 'rowHeight' ? (rowHeights[index] || 24) : (colWidths[index] || 96);
    setResizing({ type, index, startPos, startSize });
  };

  const handlePointerUp = (cellId: string, e: React.PointerEvent) => {
    setIsDragging(false);
    setIsFilling(false);
    dragStartCell.current = null;

    const now = Date.now();
    if (lastTap.current && lastTap.current.id === cellId && (now - lastTap.current.time) < 300) {
      e.preventDefault();
      handleDoubleClick(cellId);
      lastTap.current = null;
    } else {
      lastTap.current = { id: cellId, time: now };
    }
  };

  const handleDoubleClick = (cellId: string) => {
    setEditingCell(cellId);
    setEditValue(cells[cellId]?.formula || String(cells[cellId]?.value || ''));
  };

  const handleBlur = () => {
    if (editingCell) {
      onCellUpdate(editingCell, editValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const currentEditing = editingCell;
      handleBlur();
      if (currentEditing) {
        // Move down
        const row = parseInt(currentEditing.match(/[0-9]+/)?.[0] || '1');
        const col = currentEditing.match(/[A-Z]+/)?.[0] || 'A';
        const nextId = `${col}${row + 1}`;
        onCellSelect(nextId);
        onRangeSelect(nextId, nextId);
        // Start editing next cell
        setTimeout(() => {
          setEditingCell(nextId);
          setEditValue(cells[nextId]?.formula || String(cells[nextId]?.value || ''));
        }, 10);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleBlur();
      // Move right
      const row = parseInt(editingCell!.match(/[0-9]+/)?.[0] || '1');
      const col = colToNumber(editingCell!.match(/[A-Z]+/)?.[0] || 'A');
      const nextId = `${numberToCol(col + 1)}${row}`;
      onCellSelect(nextId);
      onRangeSelect(nextId, nextId);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      const input = inputRef.current;
      const timeout = setTimeout(() => {
        input.focus();
        const length = input.value.length;
        input.setSelectionRange(length, length);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [editingCell]);

  useEffect(() => {
    if (selectedCell && !editingCell) {
      const el = document.querySelector(`[data-cell-id="${selectedCell}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }, [selectedCell, editingCell]);

  const rangeInfo = useMemo(() => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    const sCol = colToNumber(start.match(/[A-Z]+/)?.[0] || 'A');
    const sRow = parseInt(start.match(/[0-9]+/)?.[0] || '1');
    const eCol = colToNumber(end.match(/[A-Z]+/)?.[0] || 'A');
    const eRow = parseInt(end.match(/[0-9]+/)?.[0] || '1');
    return {
      minCol: Math.min(sCol, eCol),
      maxCol: Math.max(sCol, eCol),
      minRow: Math.min(sRow, eRow),
      maxRow: Math.max(sRow, eRow)
    };
  }, [selectionRange]);

  const isInPrintArea = useCallback((cellId: string) => {
    if (!printArea) return false;
    const sCol = colToNumber(printArea.start.match(/[A-Z]+/)?.[0] || 'A');
    const sRow = parseInt(printArea.start.match(/[0-9]+/)?.[0] || '1');
    const eCol = colToNumber(printArea.end.match(/[A-Z]+/)?.[0] || 'A');
    const eRow = parseInt(printArea.end.match(/[0-9]+/)?.[0] || '1');

    const minC = Math.min(sCol, eCol);
    const maxC = Math.max(sCol, eCol);
    const minR = Math.min(sRow, eRow);
    const maxR = Math.max(sRow, eRow);

    const c = colToNumber(cellId.match(/[A-Z]+/)?.[0] || 'A');
    const r = parseInt(cellId.match(/[0-9]+/)?.[0] || '1');

    return c >= minC && c <= maxC && r >= minR && r <= maxR;
  }, [printArea]);

  const getPrintAreaStyle = useCallback((cellId: string) => {
    if (!printArea) return {};
    const sCol = colToNumber(printArea.start.match(/[A-Z]+/)?.[0] || 'A');
    const sRow = parseInt(printArea.start.match(/[0-9]+/)?.[0] || '1');
    const eCol = colToNumber(printArea.end.match(/[A-Z]+/)?.[0] || 'A');
    const eRow = parseInt(printArea.end.match(/[0-9]+/)?.[0] || '1');

    const minC = Math.min(sCol, eCol);
    const maxC = Math.max(sCol, eCol);
    const minR = Math.min(sRow, eRow);
    const maxR = Math.max(sRow, eRow);

    const c = colToNumber(cellId.match(/[A-Z]+/)?.[0] || 'A');
    const r = parseInt(cellId.match(/[0-9]+/)?.[0] || '1');

    const style: React.CSSProperties = {};
    if (c >= minC && c <= maxC && r >= minR && r <= maxR) {
      if (c === minC) style.borderLeft = '2px dashed #107c41';
      if (c === maxC) style.borderRight = '2px dashed #107c41';
      if (r === minR) style.borderTop = '2px dashed #107c41';
      if (r === maxR) style.borderBottom = '2px dashed #107c41';
    }
    return style;
  }, [printArea]);

  const isInRange = useCallback((cellId: string) => {
    if (!rangeInfo) return false;
    const c = colToNumber(cellId.match(/[A-Z]+/)?.[0] || 'A');
    const r = parseInt(cellId.match(/[0-9]+/)?.[0] || '1');
    return c >= rangeInfo.minCol && c <= rangeInfo.maxCol && r >= rangeInfo.minRow && r <= rangeInfo.maxRow;
  }, [rangeInfo]);

  const isHeaderHighlighted = useCallback((type: 'row' | 'col', index: number) => {
    if (!rangeInfo) return false;
    if (type === 'row') return index >= rangeInfo.minRow && index <= rangeInfo.maxRow;
    return index >= rangeInfo.minCol && index <= rangeInfo.maxCol;
  }, [rangeInfo]);

  const getMergedInfo = useCallback((cellId: string) => {
    if (!mergedCells) return null;
    for (const range of mergedCells) {
      const sCol = colToNumber(range.start.match(/[A-Z]+/)?.[0] || 'A');
      const sRow = parseInt(range.start.match(/[0-9]+/)?.[0] || '1');
      const eCol = colToNumber(range.end.match(/[A-Z]+/)?.[0] || 'A');
      const eRow = parseInt(range.end.match(/[0-9]+/)?.[0] || '1');
      
      const minC = Math.min(sCol, eCol);
      const maxC = Math.max(sCol, eCol);
      const minR = Math.min(sRow, eRow);
      const maxR = Math.max(sRow, eRow);

      const c = colToNumber(cellId.match(/[A-Z]+/)?.[0] || 'A');
      const r = parseInt(cellId.match(/[0-9]+/)?.[0] || '1');

      if (c >= minC && c <= maxC && r >= minR && r <= maxR) {
        return {
          isStart: c === minC && r === minR,
          range: { minC, maxC, minR, maxR }
        };
      }
    }
    return null;
  }, [mergedCells]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-[#f3f2f1] relative select-none no-scrollbar touch-none"
      onPointerMove={handlePointerMove}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onCellSelect('');
          onRangeSelect('', '');
        }
      }}
    >
      <div className="inline-block min-w-full">
        {/* Header Row */}
        {showHeadings && (
          <div className="flex sticky top-0 z-20 bg-[#f3f2f1]">
            <div 
              onPointerDown={() => {
                onCellSelect('A1');
                onRangeSelect('A1', `${numberToCol(COLS)}${ROWS}`);
              }}
              className="w-10 h-6 border-r border-b border-gray-300 bg-[#e1dfdd] shrink-0 cursor-pointer hover:bg-[#d0cfce] touch-none" 
            />
            {Array.from({ length: COLS }).map((_, i) => {
              const colNum = i + 1;
              const highlighted = isHeaderHighlighted('col', colNum);
              return (
                <div 
                  key={i} 
                  style={{ width: colWidths[colNum] || DEFAULT_COL_WIDTH }}
                  onPointerDown={() => {
                    const start = `${numberToCol(colNum)}1`;
                    const end = `${numberToCol(colNum)}${ROWS}`;
                    onCellSelect(start);
                    onRangeSelect(start, end);
                  }}
                  className={`h-6 border-r border-b border-gray-300 flex items-center justify-center text-[10px] font-medium shrink-0 transition-colors cursor-pointer touch-none relative ${highlighted ? 'bg-[#c8c6c4] text-[#107c41] border-b-2 border-b-[#107c41]' : 'bg-[#e1dfdd] text-gray-600 hover:bg-[#d0cfce]'}`}
                >
                  {numberToCol(colNum)}
                  <div 
                    onPointerDown={(e) => handleResizerPointerDown(e, 'colWidth', colNum)}
                    className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-[#107c41] active:bg-[#107c41] z-30 transition-colors"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Rows */}
        {Array.from({ length: ROWS }).map((_, r) => {
          const rowNum = r + 1;
          const rowHighlighted = isHeaderHighlighted('row', rowNum);
          return (
            <div key={r} className="flex" style={{ height: rowHeights[rowNum] || DEFAULT_ROW_HEIGHT }}>
              {/* Row Header */}
              {showHeadings && (
                <div 
                  onPointerDown={() => {
                    const start = `A${rowNum}`;
                    const end = `${numberToCol(COLS)}${rowNum}`;
                    onCellSelect(start);
                    onRangeSelect(start, end);
                  }}
                  className={`w-10 h-full border-r border-b border-gray-300 flex items-center justify-center text-[10px] font-medium sticky left-0 z-10 shrink-0 transition-colors cursor-pointer touch-none relative ${rowHighlighted ? 'bg-[#c8c6c4] text-[#107c41] border-r-2 border-r-[#107c41]' : 'bg-[#e1dfdd] text-gray-600 hover:bg-[#d0cfce]'}`}
                >
                  {rowNum}
                  <div 
                    onPointerDown={(e) => handleResizerPointerDown(e, 'rowHeight', rowNum)}
                    className="absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-[#107c41] active:bg-[#107c41] z-30 transition-colors"
                  />
                </div>
              )}
              
              {/* Cells */}
              {Array.from({ length: COLS }).map((_, c) => {
                const colNum = c + 1;
                const cellId = `${numberToCol(colNum)}${rowNum}`;
                const cellData = cells[cellId];
                const isSelected = selectedCell === cellId;
                const isEditing = editingCell === cellId;
                const highlighted = isInRange(cellId);
                const printAreaStyle = getPrintAreaStyle(cellId);

                const mergedInfo = getMergedInfo(cellId);
                if (mergedInfo && !mergedInfo.isStart) return null;

                let width = colWidths[colNum] || DEFAULT_COL_WIDTH;
                let height = rowHeights[rowNum] || DEFAULT_ROW_HEIGHT;

                if (mergedInfo?.isStart) {
                  width = 0;
                  for (let i = mergedInfo.range.minC; i <= mergedInfo.range.maxC; i++) {
                    width += colWidths[i] || DEFAULT_COL_WIDTH;
                  }
                  height = 0;
                  for (let i = mergedInfo.range.minR; i <= mergedInfo.range.maxR; i++) {
                    height += rowHeights[i] || DEFAULT_ROW_HEIGHT;
                  }
                }

                return (
                  <div 
                    key={c}
                    data-cell-id={cellId}
                    tabIndex={0}
                    onPointerDown={(e) => handlePointerDown(cellId, e)}
                    onPointerUp={(e) => handlePointerUp(cellId, e)}
                    onMouseEnter={() => handleMouseEnter(cellId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isSelected && !isEditing) {
                        e.preventDefault();
                        handleDoubleClick(cellId);
                      }
                    }}
                    className={`
                      border-r border-b shrink-0 relative outline-none select-none cursor-pointer touch-none
                      ${isSelected ? 'ring-2 ring-[#107c41] z-30' : ''}
                      ${highlighted && !isSelected ? 'bg-blue-100/30' : ''}
                      ${!showGridlines && !highlighted && !isSelected ? 'border-transparent' : 'border-gray-300'}
                    `}
                    style={{
                      display: 'flex',
                      width,
                      height,
                      zIndex: mergedInfo ? 10 : (isSelected ? 30 : 1),
                      fontWeight: cellData?.style?.bold ? 'bold' : 'normal',
                      fontStyle: cellData?.style?.italic ? 'italic' : 'normal',
                      textDecoration: [
                        cellData?.style?.underline ? 'underline' : '',
                        cellData?.style?.strikethrough ? 'line-through' : ''
                      ].filter(Boolean).join(' '),
                      textAlign: cellData?.style?.textAlign || 'left',
                      justifyContent: cellData?.style?.textAlign === 'center' ? 'center' : cellData?.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      backgroundColor: cellData?.style?.backgroundColor || (highlighted && !isSelected ? '#e7f1ff' : 'white'),
                      color: cellData?.style?.color || 'black',
                      fontFamily: cellData?.style?.fontFamily || 'DM Sans',
                      fontSize: cellData?.style?.fontSize ? `${cellData?.style?.fontSize}px` : '13px',
                      borderTop: cellData?.style?.borderTop,
                      borderBottom: cellData?.style?.borderBottom,
                      borderLeft: cellData?.style?.borderLeft,
                      borderRight: cellData?.style?.borderRight,
                      ...printAreaStyle
                    } as React.CSSProperties}
                  >
                    {isEditing ? (
                      <input 
                        ref={inputRef}
                        autoFocus
                        type="text"
                        inputMode="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleBlur}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                          const val = e.target.value;
                          e.target.setSelectionRange(val.length, val.length);
                        }}
                        onKeyDown={handleKeyDown}
                        className="absolute inset-0 w-full h-full px-1 outline-none border-2 border-[#107c41] z-40 bg-white touch-auto select-text"
                        style={{ fontSize: cellData?.style?.fontSize ? `${cellData?.style?.fontSize}px` : '13px' }}
                      />
                    ) : (
                      <div 
                        className={`px-1 w-full h-full flex ${mergedInfo ? '' : 'truncate'}`}
                        style={{ 
                          justifyContent: cellData?.style?.textAlign === 'center' ? 'center' : cellData?.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                          alignItems: cellData?.style?.verticalAlign === 'top' ? 'flex-start' : cellData?.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                          textAlign: cellData?.style?.textAlign || 'left'
                        }}
                      >
                        {cellData?.value}
                      </div>
                    )}
                    
                    {isSelected && !isEditing && (
                      <div 
                        onPointerDown={(e) => handleFillHandlePointerDown(e, cellId)}
                        className="absolute bottom-[-4px] right-[-4px] w-2.5 h-2.5 bg-[#107c41] border border-white cursor-crosshair z-50 hover:scale-125 transition-transform" 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
