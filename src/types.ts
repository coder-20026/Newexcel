export type CellValue = string | number;

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontFamily?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
}

export interface CellData {
  value: CellValue;
  formula: string;
  style: CellStyle;
  comment?: string;
  link?: string;
}

export interface MergedRange {
  start: string; // e.g. "A1"
  end: string;   // e.g. "B2"
}

export interface PrintArea {
  start: string;
  end: string;
}

export interface SheetData {
  id: string;
  name: string;
  cells: Record<string, CellData>;
  mergedCells: MergedRange[];
  rowHeights: Record<number, number>;
  colWidths: Record<number, number>;
  showGridlines: boolean;
  showHeadings: boolean;
  frozenRows: number;
  frozenCols: number;
  printArea?: PrintArea | null;
}

export interface SpreadsheetState {
  fileName: string;
  sheets: SheetData[];
  activeSheetId: string;
  selectedCell: string | null;
  selectionRange: { start: string; end: string } | null;
  clipboard: {
    type: 'copy' | 'cut';
    cells: Record<string, CellData>;
    sourceRange: { start: string; end: string };
  } | null;
  history: {
    past: SheetData[][];
    future: SheetData[][];
  };
  searchQuery: string;
  searchResults: string[];
  currentSearchIndex: number;
}
