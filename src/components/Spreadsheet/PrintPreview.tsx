import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { SheetData, CellData, PrintArea } from '../../types';
import { colToNumber, numberToCol } from '../../utils/formulas';

import { motion, AnimatePresence } from 'motion/react';

interface PrintPreviewProps {
  sheet: SheetData;
  onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ sheet, onClose }) => {
  const { printArea, cells, rowHeights, colWidths } = sheet;

  if (!printArea) return null;

  const sCol = colToNumber(printArea.start.match(/[A-Z]+/)?.[0] || 'A');
  const sRow = parseInt(printArea.start.match(/[0-9]+/)?.[0] || '1');
  const eCol = colToNumber(printArea.end.match(/[A-Z]+/)?.[0] || 'A');
  const eRow = parseInt(printArea.end.match(/[0-9]+/)?.[0] || '1');

  const minC = Math.min(sCol, eCol);
  const maxC = Math.max(sCol, eCol);
  const minR = Math.min(sRow, eRow);
  const maxR = Math.max(sRow, eRow);

  const rows = Array.from({ length: maxR - minR + 1 }, (_, i) => minR + i);
  const cols = Array.from({ length: maxC - minC + 1 }, (_, i) => minC + i);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      >
        {/* Header */}
        <div className="bg-[#f3f2f1] border-b border-gray-300 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#107c41] p-2 rounded-lg">
              <Printer size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Print Preview</h2>
              <p className="text-xs text-gray-500">Review your document before printing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0d6635] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Printer size={16} />
              Print
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center print:p-0 print:bg-white">
          <div className="bg-white shadow-lg border border-gray-300 p-8 min-w-fit print:shadow-none print:border-none print:p-0 print-area">
            <div className="inline-block border-t border-l border-gray-300">
              {rows.map(r => (
                <div key={r} className="flex" style={{ height: rowHeights[r] || 20 }}>
                  {cols.map(c => {
                    const cellId = `${numberToCol(c)}${r}`;
                    const cellData = cells[cellId];
                    
                    // Check if this cell is part of a merge but not the start
                    const isMerged = sheet.mergedCells.find(m => {
                      const msCol = colToNumber(m.start.match(/[A-Z]+/)?.[0] || 'A');
                      const msRow = parseInt(m.start.match(/[0-9]+/)?.[0] || '1');
                      const meCol = colToNumber(m.end.match(/[A-Z]+/)?.[0] || 'A');
                      const meRow = parseInt(m.end.match(/[0-9]+/)?.[0] || '1');
                      
                      const minMC = Math.min(msCol, meCol);
                      const maxMC = Math.max(msCol, meCol);
                      const minMR = Math.min(msRow, meRow);
                      const maxMR = Math.max(msRow, meRow);
                      
                      return c >= minMC && c <= maxMC && r >= minMR && r <= maxMR && cellId !== m.start;
                    });

                    if (isMerged) return null;

                    const merge = sheet.mergedCells.find(m => m.start === cellId);
                    let width = colWidths[c] || 64;
                    let height = rowHeights[r] || 20;

                    if (merge) {
                      const msCol = colToNumber(merge.start.match(/[A-Z]+/)?.[0] || 'A');
                      const msRow = parseInt(merge.start.match(/[0-9]+/)?.[0] || '1');
                      const meCol = colToNumber(merge.end.match(/[A-Z]+/)?.[0] || 'A');
                      const meRow = parseInt(merge.end.match(/[0-9]+/)?.[0] || '1');
                      
                      width = 0;
                      for (let i = Math.min(msCol, meCol); i <= Math.max(msCol, meCol); i++) {
                        width += colWidths[i] || 64;
                      }
                      height = 0;
                      for (let i = Math.min(msRow, meRow); i <= Math.max(msRow, meRow); i++) {
                        height += rowHeights[i] || 20;
                      }
                    }

                    return (
                      <div 
                        key={c}
                        className="border-r border-b border-gray-300 flex items-center px-1 overflow-hidden"
                        style={{
                          width,
                          height,
                          fontWeight: cellData?.style?.bold ? 'bold' : 'normal',
                          fontStyle: cellData?.style?.italic ? 'italic' : 'normal',
                          textDecoration: [
                            cellData?.style?.underline ? 'underline' : '',
                            cellData?.style?.strikethrough ? 'line-through' : ''
                          ].filter(Boolean).join(' '),
                          textAlign: cellData?.style?.textAlign || 'left',
                          justifyContent: cellData?.style?.textAlign === 'center' ? 'center' : cellData?.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                          backgroundColor: cellData?.style?.backgroundColor || 'white',
                          color: cellData?.style?.color || 'black',
                          fontFamily: cellData?.style?.fontFamily || 'sans-serif',
                          fontSize: cellData?.style?.fontSize ? `${cellData?.style?.fontSize}px` : '12px',
                        }}
                      >
                        {cellData?.value}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f3f2f1] border-t border-gray-300 p-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            Range: {printArea.start}:{printArea.end} • {rows.length} Rows x {cols.length} Columns
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-gray-400" />
              <span>Portrait</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-gray-400 bg-gray-200" />
              <span>A4 Paper</span>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </motion.div>
  );
};
