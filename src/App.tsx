/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Spreadsheet/Header';
import { Ribbon } from './components/Spreadsheet/Ribbon';
import { FormulaBar } from './components/Spreadsheet/FormulaBar';
import { Grid } from './components/Spreadsheet/Grid';
import { Footer } from './components/Spreadsheet/Footer';
import { PrintPreview } from './components/Spreadsheet/PrintPreview';
import { StatusBar } from './components/Spreadsheet/StatusBar';
import { SpreadsheetState, SheetData, CellData, CellStyle, MergedRange } from './types';
import { parseFormula, colToNumber, numberToCol } from './utils/formulas';

const INITIAL_SHEET: SheetData = {
  id: 'sheet1',
  name: 'Sheet1',
  cells: {},
  mergedCells: [],
  rowHeights: {},
  colWidths: {},
  showGridlines: true,
  showHeadings: true,
  frozenRows: 0,
  frozenCols: 0,
};

const INITIAL_STATE: SpreadsheetState = {
  fileName: 'Book1',
  sheets: [INITIAL_SHEET],
  activeSheetId: 'sheet1',
  selectedCell: 'A1',
  selectionRange: { start: 'A1', end: 'A1' },
  clipboard: null,
  history: {
    past: [],
    future: [],
  },
  searchQuery: '',
  searchResults: [],
  currentSearchIndex: -1,
};

export default function App() {
  const [state, setState] = useState<SpreadsheetState>(() => {
    const saved = localStorage.getItem('excel_clone_state_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed, history: INITIAL_STATE.history };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const activeSheet = useMemo(() => 
    state.sheets.find(s => s.id === state.activeSheetId) || state.sheets[0],
  [state.sheets, state.activeSheetId]);

  const selectedCellData = useMemo(() => 
    state.selectedCell ? activeSheet.cells[state.selectedCell] : null,
  [activeSheet.cells, state.selectedCell]);

  // Save to localStorage
  const saveToLocal = useCallback((currentState: SpreadsheetState) => {
    const { history, ...toSave } = currentState;
    localStorage.setItem('excel_clone_state_v3', JSON.stringify(toSave));
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocal(state);
    }, 30000);
    return () => clearInterval(interval);
  }, [state, saveToLocal]);

  const pushToHistory = useCallback((sheets: SheetData[]) => {
    setState(prev => {
      const newPast = [prev.sheets, ...prev.history.past].slice(0, 50);
      return {
        ...prev,
        sheets,
        history: {
          past: newPast,
          future: [],
        }
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setState(prev => {
      if (prev.history.past.length === 0) return prev;
      const previous = prev.history.past[0];
      const newPast = prev.history.past.slice(1);
      return {
        ...prev,
        sheets: previous,
        history: {
          past: newPast,
          future: [prev.sheets, ...prev.history.future],
        }
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setState(prev => {
      if (prev.history.future.length === 0) return prev;
      const next = prev.history.future[0];
      const newFuture = prev.history.future.slice(1);
      return {
        ...prev,
        sheets: next,
        history: {
          past: [prev.sheets, ...prev.history.past],
          future: newFuture,
        }
      };
    });
  }, []);

  const handleCellSelect = useCallback((cellId: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedCell: cellId,
      selectionRange: { start: cellId, end: cellId }
    }));
  }, []);

  const handleRangeSelect = useCallback((start: string, end: string) => {
    setState(prev => ({ ...prev, selectionRange: { start, end } }));
  }, []);

  const getCellsInRange = useCallback((range: { start: string; end: string }) => {
    const startCol = colToNumber(range.start.match(/[A-Z]+/)?.[0] || 'A');
    const startRow = parseInt(range.start.match(/[0-9]+/)?.[0] || '1');
    const endCol = colToNumber(range.end.match(/[A-Z]+/)?.[0] || 'A');
    const endRow = parseInt(range.end.match(/[0-9]+/)?.[0] || '1');

    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    const cellIds: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cellIds.push(`${numberToCol(c)}${r}`);
      }
    }
    return cellIds;
  }, []);

  const handleCellUpdate = useCallback((cellId: string, value: string) => {
    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        const isFormula = value.startsWith('=');
        const formula = isFormula ? value : '';
        const rawValue = isFormula ? parseFormula(value, sheet.cells) : value;
        
        const newCells = {
          ...sheet.cells,
          [cellId]: {
            ...(sheet.cells[cellId] || { style: {} }),
            value: rawValue,
            formula: formula,
          }
        };

        // Recalculate all formulas
        Object.keys(newCells).forEach(id => {
          if (newCells[id].formula) {
            newCells[id].value = parseFormula(newCells[id].formula, newCells);
          }
        });

        return { ...sheet, cells: newCells };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, pushToHistory]);

  const handleFormatChange = useCallback((updates: Partial<CellStyle> | keyof CellStyle, value?: any) => {
    if (!state.selectionRange) return;
    const cellIds = getCellsInRange(state.selectionRange);

    const formatUpdates = typeof updates === 'string' ? { [updates]: value } : updates;

    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        const newCells = { ...sheet.cells };
        cellIds.forEach(id => {
          const currentCell = newCells[id] || { value: '', formula: '', style: {} };
          newCells[id] = {
            ...currentCell,
            style: {
              ...currentCell.style,
              ...formatUpdates
            }
          };
        });
        return { ...sheet, cells: newCells };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, state.selectionRange, getCellsInRange, pushToHistory]);

  const handleSheetSelect = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeSheetId: id }));
  }, []);

  const handleAddSheet = useCallback(() => {
    const newId = `sheet${Date.now()}`;
    const newName = `Sheet${state.sheets.length + 1}`;
    const newSheet: SheetData = {
      id: newId,
      name: newName,
      cells: {},
      mergedCells: [],
      rowHeights: {},
      colWidths: {},
      showGridlines: true,
      showHeadings: true,
      frozenRows: 0,
      frozenCols: 0,
    };
    pushToHistory([...state.sheets, newSheet]);
    setState(prev => ({ ...prev, activeSheetId: newId }));
  }, [state.sheets, pushToHistory]);

  const handleDeleteSheet = useCallback((id: string) => {
    if (state.sheets.length <= 1) return;
    const newSheets = state.sheets.filter(s => s.id !== id);
    const newActiveId = state.activeSheetId === id ? newSheets[0].id : state.activeSheetId;
    pushToHistory(newSheets);
    setState(prev => ({ ...prev, activeSheetId: newActiveId }));
  }, [state.sheets, state.activeSheetId, pushToHistory]);

  const handleRenameSheet = useCallback((id: string, name: string) => {
    const newSheets = state.sheets.map(s => s.id === id ? { ...s, name } : s);
    pushToHistory(newSheets);
  }, [state.sheets, pushToHistory]);

  const handleCopy = useCallback(() => {
    if (!state.selectionRange) return;
    const cellIds = getCellsInRange(state.selectionRange);
    const copiedCells: Record<string, CellData> = {};
    cellIds.forEach(id => {
      if (activeSheet.cells[id]) {
        copiedCells[id] = { ...activeSheet.cells[id] };
      }
    });
    setState(prev => ({
      ...prev,
      clipboard: { type: 'copy', cells: copiedCells, sourceRange: state.selectionRange! }
    }));
  }, [state.selectionRange, activeSheet.cells, getCellsInRange]);

  const handleClear = useCallback(() => {
    if (!state.selectionRange) return;
    const cellIds = getCellsInRange(state.selectionRange);
    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        const newCells = { ...sheet.cells };
        cellIds.forEach(id => delete newCells[id]);
        return { ...sheet, cells: newCells };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, state.selectionRange, getCellsInRange, pushToHistory]);

  const handleCut = useCallback(() => {
    if (!state.selectionRange) return;
    handleCopy();
    handleClear();
  }, [handleCopy, handleClear, state.selectionRange]);

  const handlePaste = useCallback(() => {
    if (!state.clipboard || !state.selectedCell) return;
    
    const targetStart = state.selectedCell;
    const sourceStart = state.clipboard.sourceRange.start;
    
    const targetCol = colToNumber(targetStart.match(/[A-Z]+/)?.[0] || 'A');
    const targetRow = parseInt(targetStart.match(/[0-9]+/)?.[0] || '1');
    const sourceCol = colToNumber(sourceStart.match(/[A-Z]+/)?.[0] || 'A');
    const sourceRow = parseInt(sourceStart.match(/[0-9]+/)?.[0] || '1');

    const colDiff = targetCol - sourceCol;
    const rowDiff = targetRow - sourceRow;

    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        const newCells = { ...sheet.cells };
        Object.entries(state.clipboard!.cells).forEach(([id, data]) => {
          const cellData = data as CellData;
          const sCol = colToNumber(id.match(/[A-Z]+/)?.[0] || 'A');
          const sRow = parseInt(id.match(/[0-9]+/)?.[0] || '1');
          const tId = `${numberToCol(sCol + colDiff)}${sRow + rowDiff}`;
          newCells[tId] = { ...cellData };
        });
        return { ...sheet, cells: newCells };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, state.clipboard, state.selectedCell, pushToHistory]);

  const handleSort = useCallback((direction: 'asc' | 'desc') => {
    if (!state.selectionRange) return;
    
    const { start, end } = state.selectionRange;
    const startCol = colToNumber(start.match(/[A-Z]+/)?.[0] || 'A');
    const startRow = parseInt(start.match(/[0-9]+/)?.[0] || '1');
    const endCol = colToNumber(end.match(/[A-Z]+/)?.[0] || 'A');
    const endRow = parseInt(end.match(/[0-9]+/)?.[0] || '1');

    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        const newCells = { ...sheet.cells };
        const rows: any[][] = [];
        for (let r = minRow; r <= maxRow; r++) {
          const rowData: any[] = [];
          for (let c = minCol; c <= maxCol; c++) {
            const id = `${numberToCol(c)}${r}`;
            rowData.push(newCells[id]);
          }
          rows.push(rowData);
        }

        rows.sort((a, b) => {
          const valA = a[0]?.value ?? '';
          const valB = b[0]?.value ?? '';
          if (valA === valB) return 0;
          if (direction === 'asc') return valA > valB ? 1 : -1;
          return valA < valB ? 1 : -1;
        });

        rows.forEach((rowData, rIndex) => {
          const r = minRow + rIndex;
          rowData.forEach((cellData, cIndex) => {
            const c = minCol + cIndex;
            const id = `${numberToCol(c)}${r}`;
            if (cellData) {
              newCells[id] = { ...cellData };
            } else {
              delete newCells[id];
            }
          });
        });

        return { ...sheet, cells: newCells };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, state.selectionRange, pushToHistory]);

  const handleFileNew = useCallback(() => {
    if (confirm('Create new file? Unsaved changes will be lost.')) {
      setState(INITIAL_STATE);
      localStorage.removeItem('excel_clone_state');
    }
  }, []);

  const handleFileSave = useCallback(() => {
    saveToLocal(state);
    alert('File saved to local storage!');
  }, [state, saveToLocal]);

  const handleFileExport = useCallback(() => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.entries(activeSheet.cells)
        .map(([id, data]) => `${id},${(data as CellData).value}`)
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${state.fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeSheet.cells, state.fileName]);

  const handleMergeCenter = useCallback(() => {
    if (!state.selectionRange) return;
    const { start, end } = state.selectionRange;

    const sCol = colToNumber(start.match(/[A-Z]+/)?.[0] || 'A');
    const sRow = parseInt(start.match(/[0-9]+/)?.[0] || '1');
    const eCol = colToNumber(end.match(/[A-Z]+/)?.[0] || 'A');
    const eRow = parseInt(end.match(/[0-9]+/)?.[0] || '1');

    const minCol = Math.min(sCol, eCol);
    const maxCol = Math.max(sCol, eCol);
    const minRow = Math.min(sRow, eRow);
    const maxRow = Math.max(sRow, eRow);

    const topLeftId = `${numberToCol(minCol)}${minRow}`;

    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        // Check if we are unmerging an existing range
        const existingMergeIndex = (sheet.mergedCells || []).findIndex(m => {
          // If a range is selected, it must match exactly
          if (start !== end) {
            return m.start === topLeftId && m.end === `${numberToCol(maxCol)}${maxRow}`;
          }
          // If a single cell is selected, it must be the start of a merge
          return m.start === start;
        });

        if (existingMergeIndex > -1) {
          // Unmerge
          const newMergedCells = sheet.mergedCells.filter((_, i) => i !== existingMergeIndex);
          return { ...sheet, mergedCells: newMergedCells };
        }

        // If it's a single cell and not a merge start, we can't merge it
        if (start === end) return sheet;

        const newCells = { ...sheet.cells };
        const topLeftCell = newCells[topLeftId] || { value: '', formula: '', style: {} };
        
        // Update top-left cell
        newCells[topLeftId] = {
          ...topLeftCell,
          style: { ...topLeftCell.style, textAlign: 'center' }
        };

        // Clear other cells in range
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const id = `${numberToCol(c)}${r}`;
            if (id !== topLeftId) {
              delete newCells[id];
            }
          }
        }

        const newMergedCells = [...(sheet.mergedCells || []), { start: topLeftId, end: `${numberToCol(maxCol)}${maxRow}` }];
        return { ...sheet, cells: newCells, mergedCells: newMergedCells };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, state.selectionRange, pushToHistory]);

  const handleInsertDate = useCallback(() => {
    if (!state.selectedCell) return;
    const date = new Date().toLocaleDateString();
    handleCellUpdate(state.selectedCell, date);
  }, [state.selectedCell, handleCellUpdate]);

  const handleInsertTime = useCallback(() => {
    if (!state.selectedCell) return;
    const time = new Date().toLocaleTimeString();
    handleCellUpdate(state.selectedCell, time);
  }, [state.selectedCell, handleCellUpdate]);

  const handleAutoSum = useCallback(() => {
    if (!state.selectedCell) return;
    const col = state.selectedCell.match(/[A-Z]+/)?.[0] || 'A';
    const row = parseInt(state.selectedCell.match(/[0-9]+/)?.[0] || '1');
    if (row <= 1) return;

    const range = `${col}1:${col}${row - 1}`;
    handleCellUpdate(state.selectedCell, `=SUM(${range})`);
  }, [state.selectedCell, handleCellUpdate]);

  const handleRowColOp = useCallback((type: 'insertRow' | 'deleteRow' | 'insertCol' | 'deleteCol', index: number) => {
    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        const newCells: Record<string, CellData> = {};
        const newRowHeights: Record<number, number> = {};
        const newColWidths: Record<number, number> = {};
        
        // Shift cells
        Object.entries(sheet.cells).forEach(([id, data]) => {
          const cellData = data as CellData;
          const col = colToNumber(id.match(/[A-Z]+/)?.[0] || 'A');
          const row = parseInt(id.match(/[0-9]+/)?.[0] || '1');
          
          let newCol = col;
          let newRow = row;

          if (type === 'insertRow' && row >= index) newRow++;
          if (type === 'deleteRow') {
            if (row === index) return;
            if (row > index) newRow--;
          }
          if (type === 'insertCol' && col >= index) newCol++;
          if (type === 'deleteCol') {
            if (col === index) return;
            if (col > index) newCol--;
          }

          const newId = `${numberToCol(newCol)}${newRow}`;
          newCells[newId] = cellData;
        });

        // Shift row heights
        Object.entries(sheet.rowHeights).forEach(([r, h]) => {
          const row = parseInt(r);
          let newRow = row;
          if (type === 'insertRow' && row >= index) newRow++;
          if (type === 'deleteRow') {
            if (row === index) return;
            if (row > index) newRow--;
          }
          if (newRow > 0) newRowHeights[newRow] = h as number;
        });

        // Shift col widths
        Object.entries(sheet.colWidths).forEach(([c, w]) => {
          const col = parseInt(c);
          let newCol = col;
          if (type === 'insertCol' && col >= index) newCol++;
          if (type === 'deleteCol') {
            if (col === index) return;
            if (col > index) newCol--;
          }
          if (newCol > 0) newColWidths[newCol] = w as number;
        });

        // Shift merged cells
        const newMergedCells = sheet.mergedCells.map(range => {
          const sCol = colToNumber(range.start.match(/[A-Z]+/)?.[0] || 'A');
          const sRow = parseInt(range.start.match(/[0-9]+/)?.[0] || '1');
          const eCol = colToNumber(range.end.match(/[A-Z]+/)?.[0] || 'A');
          const eRow = parseInt(range.end.match(/[0-9]+/)?.[0] || '1');

          let newSCol = sCol, newSRow = sRow, newECol = eCol, newERow = eRow;

          if (type === 'insertRow') {
            if (sRow >= index) newSRow++;
            if (eRow >= index) newERow++;
          }
          if (type === 'deleteRow') {
            if (sRow === index && eRow === index) return null;
            if (sRow > index) newSRow--;
            if (eRow >= index) newERow--;
          }
          if (type === 'insertCol') {
            if (sCol >= index) newSCol++;
            if (eCol >= index) newECol++;
          }
          if (type === 'deleteCol') {
            if (sCol === index && eCol === index) return null;
            if (sCol > index) newSCol--;
            if (eCol >= index) newECol--;
          }

          return {
            start: `${numberToCol(newSCol)}${newSRow}`,
            end: `${numberToCol(newECol)}${newERow}`
          };
        }).filter(Boolean) as MergedRange[];

        return { 
          ...sheet, 
          cells: newCells,
          rowHeights: newRowHeights,
          colWidths: newColWidths,
          mergedCells: newMergedCells
        };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, pushToHistory]);

  const handleSizeChange = useCallback((type: 'rowHeight' | 'colWidth', index: number, value: number) => {
    // Value is already in pixels (dp) from the Ribbon or Grid dragging
    const min = 0;
    const max = type === 'rowHeight' ? 1000 : 5000; // Increased limits for flexibility
    const clampedValue = Math.min(max, Math.max(min, value));

    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        return {
          ...sheet,
          [type === 'rowHeight' ? 'rowHeights' : 'colWidths']: {
            ...sheet[type === 'rowHeight' ? 'rowHeights' : 'colWidths'],
            [index]: clampedValue
          }
        };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, pushToHistory]);

  const handleSetPrintArea = useCallback(() => {
    if (!state.selectionRange) return;
    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        return {
          ...sheet,
          printArea: {
            start: state.selectionRange!.start,
            end: state.selectionRange!.end
          }
        };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, state.selectionRange, pushToHistory]);

  const handleClearPrintArea = useCallback(() => {
    const newSheets = state.sheets.map(sheet => {
      if (sheet.id === state.activeSheetId) {
        return {
          ...sheet,
          printArea: null
        };
      }
      return sheet;
    });
    pushToHistory(newSheets);
  }, [state.sheets, state.activeSheetId, pushToHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'b') {
          e.preventDefault();
          handleFormatChange('bold', !selectedCellData?.style?.bold);
        } else if (e.key === 'i') {
          e.preventDefault();
          handleFormatChange('italic', !selectedCellData?.style?.italic);
        } else if (e.key === 'u') {
          e.preventDefault();
          handleFormatChange('underline', !selectedCellData?.style?.underline);
        } else if (e.key === 'c') {
          handleCopy();
        } else if (e.key === 'v') {
          handlePaste();
        } else if (e.key === 'x') {
          handleCut();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormatChange, handleCopy, handlePaste, handleCut, handleUndo, handleRedo, selectedCellData]);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-sans text-gray-900 touch-none">
      <Header fileName={state.fileName} onRename={(name) => setState(prev => ({ ...prev, fileName: name }))} />
      <Ribbon 
        onFormatChange={handleFormatChange} 
        activeFormat={selectedCellData?.style || {}}
        selectedCell={state.selectedCell}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onClear={handleClear}
        onSort={handleSort}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFileNew={handleFileNew}
        onFileSave={handleFileSave}
        onFileExport={handleFileExport}
        onRowColOp={handleRowColOp}
        onSizeChange={handleSizeChange}
        rowHeights={activeSheet.rowHeights}
        colWidths={activeSheet.colWidths}
        onMergeCenter={handleMergeCenter}
        onAutoSum={handleAutoSum}
        onInsertDate={handleInsertDate}
        onInsertTime={handleInsertTime}
        onSetPrintArea={handleSetPrintArea}
        onClearPrintArea={handleClearPrintArea}
        onPrintPreview={() => setShowPrintPreview(true)}
        hasSelection={!!state.selectionRange}
      />
      <FormulaBar 
        selectedCell={state.selectedCell || ''} 
        formula={selectedCellData?.formula || String(selectedCellData?.value || '')}
        onFormulaChange={(val) => handleCellUpdate(state.selectedCell!, val)}
      />
      <Grid 
        cells={activeSheet.cells} 
        mergedCells={activeSheet.mergedCells}
        selectedCell={state.selectedCell}
        selectionRange={state.selectionRange}
        onCellSelect={handleCellSelect}
        onRangeSelect={handleRangeSelect}
        onCellUpdate={handleCellUpdate}
        rowHeights={activeSheet.rowHeights}
        colWidths={activeSheet.colWidths}
        onSizeChange={handleSizeChange}
        showGridlines={activeSheet.showGridlines}
        showHeadings={activeSheet.showHeadings}
        printArea={activeSheet.printArea}
      />
      <StatusBar 
        cells={activeSheet.cells}
        selectionRange={state.selectionRange}
      />
      <Footer 
        sheets={state.sheets.map(s => ({ id: s.id, name: s.name }))}
        activeSheetId={state.activeSheetId}
        onSheetSelect={handleSheetSelect}
        onAddSheet={handleAddSheet}
        onDeleteSheet={handleDeleteSheet}
        onRenameSheet={handleRenameSheet}
      />

      <AnimatePresence>
        {showPrintPreview && (
          <PrintPreview 
            sheet={activeSheet} 
            onClose={() => setShowPrintPreview(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

