import React from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Type, ChevronDown, Scissors, Copy, Clipboard,
  Table, BarChart2, Filter, Plus, Undo, Redo, 
  FilePlus, Save, Download, Search, Link, MessageSquare,
  Calendar, Clock, Eye, EyeOff, Grid as GridIcon,
  Strikethrough, Eraser, Printer,
  ArrowUp, ArrowDown, Maximize, Minimize, Square
} from 'lucide-react';
import { CellStyle } from '../../types';
import { colToNumber } from '../../utils/formulas';

interface RibbonProps {
  onFormatChange: (updates: Partial<CellStyle> | keyof CellStyle, value?: any) => void;
  activeFormat: any;
  selectedCell: string | null;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onClear: () => void;
  onSort: (direction: 'asc' | 'desc') => void;
  onUndo: () => void;
  onRedo: () => void;
  onFileNew: () => void;
  onFileSave: () => void;
  onFileExport: () => void;
  onRowColOp: (type: 'insertRow' | 'deleteRow' | 'insertCol' | 'deleteCol', index: number) => void;
  onSizeChange: (type: 'rowHeight' | 'colWidth', index: number, value: number) => void;
  rowHeights: Record<number, number>;
  colWidths: Record<number, number>;
  onMergeCenter: () => void;
  onAutoSum: () => void;
  onInsertDate: () => void;
  onInsertTime: () => void;
  onSetPrintArea: () => void;
  onClearPrintArea: () => void;
  onPrintPreview: () => void;
  hasSelection: boolean;
}

export const Ribbon: React.FC<RibbonProps> = ({ 
  onFormatChange, 
  activeFormat, 
  selectedCell,
  onCopy, 
  onCut,
  onPaste,
  onClear,
  onSort,
  onUndo,
  onRedo,
  onFileNew,
  onFileSave,
  onFileExport,
  onRowColOp,
  onSizeChange,
  rowHeights,
  colWidths,
  onMergeCenter,
  onAutoSum,
  onInsertDate,
  onInsertTime,
  onSetPrintArea,
  onClearPrintArea,
  onPrintPreview,
  hasSelection,
}) => {
  const [activeTab, setActiveTab] = React.useState<string | null>('home');
  const [borderThickness, setBorderThickness] = React.useState(1);

  const tabs = ['File', 'Home', 'Insert', 'Formulas', 'Data', 'View'];
  const thicknesses = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5];

  const colors = [
    '#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
    '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79'
  ];

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
  const fonts = ['DM Sans', 'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];

  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      className="bg-[#f3f2f1] border-b border-gray-300 shrink-0 select-none"
    >
      <div className="flex items-center h-8 px-4 overflow-x-auto no-scrollbar justify-between touch-pan-x">
        <div className="flex items-center h-full">
          {tabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(prev => prev === tab.toLowerCase() ? null : tab.toLowerCase())}
              className={`
                px-4 h-full text-xs font-normal border-t-2 transition-colors whitespace-nowrap
                ${activeTab === tab.toLowerCase() 
                  ? 'bg-white border-[#107c41] text-[#107c41] font-medium' 
                  : 'border-transparent text-gray-600 hover:bg-gray-200'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Always visible Undo/Redo */}
        <div className="flex items-center gap-1 px-2 border-l border-gray-200 h-full bg-white/50">
          <button onClick={onUndo} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Undo">
            <Undo size={14} />
          </button>
          <button onClick={onRedo} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Redo">
            <Redo size={14} />
          </button>
        </div>
      </div>
      
      <div className={`bg-white border-t border-gray-200 overflow-hidden transition-all duration-200 ${activeTab ? 'h-20' : 'h-0'}`}>
        {activeTab === 'home' && (
          <div className="h-full p-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Clipboard */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200 h-full">
              <div onClick={onPaste} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[40px]">
                <Clipboard size={20} className="text-[#107c41]" />
                <span className="text-[10px]">Paste</span>
              </div>
              <div className="flex flex-col justify-center">
                <div onClick={onCut} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
                  <Scissors size={14} />
                  <span className="text-[10px]">Cut</span>
                </div>
                <div onClick={onCopy} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
                  <Copy size={14} />
                  <span className="text-[10px]">Copy</span>
                </div>
              </div>
            </div>

            {/* Font */}
            <div className="flex items-center gap-2 px-2 border-r border-gray-200 h-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <select 
                    value={activeFormat.fontFamily || 'DM Sans'}
                    onChange={(e) => onFormatChange('fontFamily', e.target.value)}
                    className="bg-gray-50 border border-gray-300 px-2 py-0.5 rounded text-xs outline-none min-w-[100px]"
                  >
                    {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select 
                    value={activeFormat.fontSize || 11}
                    onChange={(e) => onFormatChange('fontSize', parseInt(e.target.value))}
                    className="bg-gray-50 border border-gray-300 px-1 py-0.5 rounded text-xs outline-none"
                  >
                    {fontSizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onFormatChange('bold', !activeFormat.bold)} className={`p-1 rounded ${activeFormat.bold ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Bold size={14} /></button>
                  <button onClick={() => onFormatChange('italic', !activeFormat.italic)} className={`p-1 rounded ${activeFormat.italic ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Italic size={14} /></button>
                  <button onClick={() => onFormatChange('underline', !activeFormat.underline)} className={`p-1 rounded ${activeFormat.underline ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Underline size={14} /></button>
                  <button onClick={() => onFormatChange('strikethrough', !activeFormat.strikethrough)} className={`p-1 rounded ${activeFormat.strikethrough ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Strikethrough size={14} /></button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  
                  {/* Text Color */}
                  <div className="relative group">
                    <button className="p-1 rounded hover:bg-gray-100 flex flex-col items-center">
                      <Type size={14} style={{ color: activeFormat.color || 'black' }} />
                      <div className="h-0.5 w-full bg-red-600" style={{ backgroundColor: activeFormat.color || 'red' }} />
                    </button>
                    <div className="hidden group-hover:grid grid-cols-8 gap-1 p-2 bg-white border border-gray-300 absolute top-full left-0 z-50 shadow-xl w-[160px]">
                      {colors.map(c => <div key={c} onClick={() => onFormatChange('color', c)} className="w-4 h-4 cursor-pointer border border-gray-200 hover:scale-125 transition-transform" style={{ backgroundColor: c }} />)}
                    </div>
                  </div>

                  {/* Fill Color */}
                  <div className="relative group">
                    <button className="p-1 rounded hover:bg-gray-100 flex flex-col items-center">
                      <div className="w-4 h-3 border border-gray-400" style={{ backgroundColor: activeFormat.backgroundColor || 'transparent' }} />
                      <ChevronDown size={8} />
                    </button>
                    <div className="hidden group-hover:grid grid-cols-8 gap-1 p-2 bg-white border border-gray-300 absolute top-full left-0 z-50 shadow-xl w-[160px]">
                      {colors.map(c => <div key={c} onClick={() => onFormatChange('backgroundColor', c)} className="w-4 h-4 cursor-pointer border border-gray-200 hover:scale-125 transition-transform" style={{ backgroundColor: c }} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200 h-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => onFormatChange('verticalAlign', 'top')} className={`p-1 rounded ${activeFormat.verticalAlign === 'top' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Top Align"><AlignStartVertical size={14} /></button>
                  <button onClick={() => onFormatChange('verticalAlign', 'middle')} className={`p-1 rounded ${activeFormat.verticalAlign === 'middle' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Middle Align"><AlignCenterVertical size={14} /></button>
                  <button onClick={() => onFormatChange('verticalAlign', 'bottom')} className={`p-1 rounded ${activeFormat.verticalAlign === 'bottom' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Bottom Align"><AlignEndVertical size={14} /></button>
                  <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                  <button onClick={() => onFormatChange('textAlign', 'left')} className={`p-1 rounded ${activeFormat.textAlign === 'left' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Align Left"><AlignLeft size={14} /></button>
                  <button onClick={() => onFormatChange('textAlign', 'center')} className={`p-1 rounded ${activeFormat.textAlign === 'center' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Center"><AlignCenter size={14} /></button>
                  <button onClick={() => onFormatChange('textAlign', 'right')} className={`p-1 rounded ${activeFormat.textAlign === 'right' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Align Right"><AlignRight size={14} /></button>
                </div>
                <button onClick={onMergeCenter} className="text-[10px] bg-gray-50 border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-100">Merge & Center</button>
              </div>
            </div>

            {/* Editing */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200 h-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => onSort('asc')} className="p-1 hover:bg-gray-100 rounded flex items-center gap-1 text-[10px] border border-gray-200"><ArrowUp size={12} />Sort A-Z</button>
                  <button onClick={() => onSort('desc')} className="p-1 hover:bg-gray-100 rounded flex items-center gap-1 text-[10px] border border-gray-200"><ArrowDown size={12} />Sort Z-A</button>
                </div>
                <button onClick={onClear} className="p-1 hover:bg-gray-100 rounded flex items-center justify-center gap-1 text-[10px] border border-gray-200 text-red-600"><Eraser size={12} />Clear All</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="h-full p-1 flex items-center gap-4 px-4">
            <div onClick={onFileNew} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[50px]">
              <FilePlus size={20} className="text-blue-600" />
              <span className="text-[10px]">New</span>
            </div>
            <div onClick={() => alert('Open file coming soon!')} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[50px]">
              <Plus size={20} className="text-gray-600" />
              <span className="text-[10px]">Open</span>
            </div>
            <div onClick={onFileSave} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[50px]">
              <Save size={20} className="text-[#107c41]" />
              <span className="text-[10px]">Save</span>
            </div>
            <div onClick={onFileExport} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[50px]">
              <Download size={20} className="text-orange-600" />
              <span className="text-[10px]">Export CSV</span>
            </div>
          </div>
        )}

        {activeTab === 'insert' && (
          <div className="h-full p-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Borders Section */}
            <div className="flex items-center gap-2 px-2 border-r border-gray-200 h-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-500">Thickness:</span>
                  <select 
                    value={borderThickness}
                    onChange={(e) => setBorderThickness(parseFloat(e.target.value))}
                    className="bg-gray-50 border border-gray-300 px-1 py-0.5 rounded text-[10px] outline-none"
                  >
                    {thicknesses.map(t => <option key={t} value={t}>{t} dp</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onFormatChange('borderTop', `${borderThickness}px solid black`)} 
                    className="p-1 hover:bg-gray-100 rounded border border-gray-200" 
                    title="Top Border"
                  >
                    <div className="w-4 h-4 border-t-2 border-black" />
                  </button>
                  <button 
                    onClick={() => onFormatChange('borderBottom', `${borderThickness}px solid black`)} 
                    className="p-1 hover:bg-gray-100 rounded border border-gray-200" 
                    title="Bottom Border"
                  >
                    <div className="w-4 h-4 border-b-2 border-black" />
                  </button>
                  <button 
                    onClick={() => onFormatChange('borderLeft', `${borderThickness}px solid black`)} 
                    className="p-1 hover:bg-gray-100 rounded border border-gray-200" 
                    title="Left Border"
                  >
                    <div className="w-4 h-4 border-l-2 border-black" />
                  </button>
                  <button 
                    onClick={() => onFormatChange('borderRight', `${borderThickness}px solid black`)} 
                    className="p-1 hover:bg-gray-100 rounded border border-gray-200" 
                    title="Right Border"
                  >
                    <div className="w-4 h-4 border-r-2 border-black" />
                  </button>
                  <button 
                    onClick={() => {
                      onFormatChange({
                        borderTop: `${borderThickness}px solid black`,
                        borderBottom: `${borderThickness}px solid black`,
                        borderLeft: `${borderThickness}px solid black`,
                        borderRight: `${borderThickness}px solid black`
                      });
                    }} 
                    className="p-1 hover:bg-gray-100 rounded border border-gray-200 flex flex-col items-center" 
                    title="All Borders"
                  >
                    <Square size={14} />
                    <span className="text-[8px]">All</span>
                  </button>
                  <button 
                    onClick={() => {
                      onFormatChange({
                        borderTop: '',
                        borderBottom: '',
                        borderLeft: '',
                        borderRight: ''
                      });
                    }} 
                    className="p-1 hover:bg-gray-100 rounded border border-gray-200 flex flex-col items-center text-red-600" 
                    title="Clear Borders"
                  >
                    <Eraser size={14} />
                    <span className="text-[8px]">Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row & Column Operations */}
            <div className="flex items-center gap-2 px-2 border-r border-gray-200 h-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      const row = parseInt(selectedCell?.match(/[0-9]+/)?.[0] || '1');
                      onRowColOp('insertRow', row);
                    }}
                    className="px-2 py-0.5 hover:bg-gray-100 rounded border border-gray-200 text-[9px] flex items-center gap-1"
                  >
                    <Plus size={10} /> Row Above
                  </button>
                  <button 
                    onClick={() => {
                      const row = parseInt(selectedCell?.match(/[0-9]+/)?.[0] || '1');
                      onRowColOp('insertRow', row + 1);
                    }}
                    className="px-2 py-0.5 hover:bg-gray-100 rounded border border-gray-200 text-[9px] flex items-center gap-1"
                  >
                    <Plus size={10} /> Row Below
                  </button>
                  <button 
                    onClick={() => {
                      const row = parseInt(selectedCell?.match(/[0-9]+/)?.[0] || '1');
                      onRowColOp('deleteRow', row);
                    }}
                    className="px-2 py-0.5 hover:bg-gray-100 rounded border border-gray-200 text-[9px] flex items-center gap-1 text-red-600"
                  >
                    <Eraser size={10} /> Delete Row
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      const col = colToNumber(selectedCell?.match(/[A-Z]+/)?.[0] || 'A');
                      onRowColOp('insertCol', col);
                    }}
                    className="px-2 py-0.5 hover:bg-gray-100 rounded border border-gray-200 text-[9px] flex items-center gap-1"
                  >
                    <Plus size={10} /> Col Left
                  </button>
                  <button 
                    onClick={() => {
                      const col = colToNumber(selectedCell?.match(/[A-Z]+/)?.[0] || 'A');
                      onRowColOp('insertCol', col + 1);
                    }}
                    className="px-2 py-0.5 hover:bg-gray-100 rounded border border-gray-200 text-[9px] flex items-center gap-1"
                  >
                    <Plus size={10} /> Col Right
                  </button>
                  <button 
                    onClick={() => {
                      const col = colToNumber(selectedCell?.match(/[A-Z]+/)?.[0] || 'A');
                      onRowColOp('deleteCol', col);
                    }}
                    className="px-2 py-0.5 hover:bg-gray-100 rounded border border-gray-200 text-[9px] flex items-center gap-1 text-red-600"
                  >
                    <Eraser size={10} /> Delete Col
                  </button>
                </div>
              </div>
            </div>

            {/* Cell Size Section */}
            <div className="flex items-center gap-2 px-2 border-r border-gray-200 h-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-500 w-16">Row Height (pt):</span>
                  <input 
                    type="number"
                    step="0.1"
                    value={selectedCell ? parseFloat(((rowHeights[parseInt(selectedCell.match(/[0-9]+/)?.[0] || '1')] || 19.95) / 1.33).toFixed(2)) : 15}
                    onChange={(e) => {
                      if (selectedCell) {
                        const row = parseInt(selectedCell.match(/[0-9]+/)?.[0] || '1');
                        let pt = parseFloat(e.target.value);
                        if (isNaN(pt)) pt = 0;
                        onSizeChange('rowHeight', row, pt * 1.33);
                      }
                    }}
                    className="w-14 bg-white border border-gray-300 px-1 py-0.5 rounded text-[10px] outline-none focus:border-[#107c41]"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-500 w-16">Col Width (char):</span>
                  <input 
                    type="number"
                    step="0.1"
                    value={selectedCell ? parseFloat(((colWidths[colToNumber(selectedCell.match(/[A-Z]+/)?.[0] || 'A')] || 59.01) / 7).toFixed(2)) : 8.43}
                    onChange={(e) => {
                      if (selectedCell) {
                        const col = colToNumber(selectedCell.match(/[A-Z]+/)?.[0] || 'A');
                        let width = parseFloat(e.target.value);
                        if (isNaN(width)) width = 0;
                        onSizeChange('colWidth', col, width * 7);
                      }
                    }}
                    className="w-14 bg-white border border-gray-300 px-1 py-0.5 rounded text-[10px] outline-none focus:border-[#107c41]"
                  />
                </div>
              </div>
            </div>

            <div onClick={onInsertDate} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[40px]">
              <Calendar size={18} />
              <span className="text-[10px]">Date</span>
            </div>
            <div onClick={onInsertTime} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[40px]">
              <Clock size={18} />
              <span className="text-[10px]">Time</span>
            </div>
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="h-full p-1 flex items-center gap-4 px-4">
            <div onClick={onAutoSum} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[60px]">
              <span className="text-xl font-bold text-[#107c41]">Σ</span>
              <span className="text-[10px]">AutoSum</span>
            </div>
            <div onClick={() => alert('Function wizard opened!')} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[60px]">
              <span className="text-xl font-bold text-blue-600 italic">ƒx</span>
              <span className="text-[10px]">Insert Function</span>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="h-full p-1 flex items-center gap-4 px-4">
            <div onClick={() => alert('Filter toggled!')} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[50px]">
              <Filter size={20} />
              <span className="text-[10px]">Filter</span>
            </div>
            <div onClick={() => onSort('asc')} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[50px]">
              <BarChart2 size={20} className="rotate-90" />
              <span className="text-[10px]">Sort</span>
            </div>
            
            <div className="w-px h-8 bg-gray-200 mx-1" />
            
            <div className="flex items-center gap-2">
              <div 
                onClick={hasSelection ? onSetPrintArea : undefined} 
                className={`flex flex-col items-center justify-center p-1 rounded cursor-pointer min-w-[60px] ${hasSelection ? 'hover:bg-gray-100' : 'opacity-40 cursor-not-allowed'}`}
              >
                <Square size={20} className="text-[#107c41]" />
                <span className="text-[10px]">Set Print Area</span>
              </div>
              <div onClick={onClearPrintArea} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[60px]">
                <Eraser size={20} className="text-red-600" />
                <span className="text-[10px]">Clear Print Area</span>
              </div>
              <div onClick={onPrintPreview} className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[60px]">
                <Printer size={20} className="text-blue-600" />
                <span className="text-[10px]">Print Preview</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="h-full p-1 flex items-center gap-4 px-4">
            <div className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[60px]">
              <GridIcon size={20} />
              <span className="text-[10px]">Gridlines</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[60px]">
              <Maximize size={20} />
              <span className="text-[10px]">Headings</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[60px]">
              <Minimize size={20} />
              <span className="text-[10px]">Freeze Panes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
