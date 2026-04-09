import React from 'react';
import { Plus, ChevronLeft, ChevronRight, List } from 'lucide-react';

interface FooterProps {
  sheets: { id: string; name: string }[];
  activeSheetId: string;
  onSheetSelect: (id: string) => void;
  onAddSheet: () => void;
  onDeleteSheet: (id: string) => void;
  onRenameSheet: (id: string, name: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  sheets, 
  activeSheetId, 
  onSheetSelect, 
  onAddSheet,
  onDeleteSheet,
  onRenameSheet
}) => {
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState('');

  const handleDoubleClick = (sheet: { id: string; name: string }) => {
    setRenamingId(sheet.id);
    setNewName(sheet.name);
  };

  const handleRenameBlur = () => {
    if (renamingId && newName.trim()) {
      onRenameSheet(renamingId, newName.trim());
    }
    setRenamingId(null);
  };

  return (
    <footer 
      onPointerDown={(e) => e.stopPropagation()}
      className="bg-[#f3f2f1] border-t border-gray-300 h-8 flex items-center px-2 justify-between shrink-0"
    >
      <div className="flex items-center h-full">
        <div 
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1 px-2 border-r border-gray-300 h-full text-gray-600"
        >
          <ChevronLeft size={14} className="cursor-pointer hover:text-black" />
          <ChevronRight size={14} className="cursor-pointer hover:text-black" />
          <List size={14} className="cursor-pointer hover:text-black ml-1" />
        </div>
        
        <div 
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center h-full overflow-x-auto no-scrollbar touch-pan-x"
        >
          {sheets.map((sheet) => (
            <div 
              key={sheet.id}
              className={`
                group px-4 h-full flex items-center text-xs cursor-pointer border-r border-gray-300 relative
                ${activeSheetId === sheet.id ? 'bg-white text-[#107c41] font-medium border-b-2 border-b-[#107c41]' : 'hover:bg-gray-200'}
              `}
              onPointerDown={(e) => { e.stopPropagation(); onSheetSelect(sheet.id); }}
              onDoubleClick={() => handleDoubleClick(sheet)}
            >
              {renamingId === sheet.id ? (
                <input 
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onBlur={handleRenameBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameBlur()}
                  className="w-20 bg-white border border-blue-500 outline-none px-1 touch-auto"
                />
              ) : (
                sheet.name
              )}
              {sheets.length > 1 && renamingId !== sheet.id && (
                <div 
                  onPointerDown={(e) => { e.stopPropagation(); onDeleteSheet(sheet.id); }}
                  className="hidden group-hover:flex absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full items-center justify-center text-[8px]"
                >
                  ×
                </div>
              )}
            </div>
          ))}
          <div 
            onPointerDown={(e) => { e.stopPropagation(); onAddSheet(); }}
            className="px-3 h-full flex items-center cursor-pointer hover:bg-gray-200"
          >
            <Plus size={14} />
          </div>
        </div>
      </div>
      
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        className="flex items-center gap-4 px-4 text-[10px] text-gray-500 hidden sm:flex"
      >
        <span>Ready</span>
        <div className="flex items-center gap-2">
          <span>100%</span>
          <div className="w-24 h-1 bg-gray-300 rounded-full relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </footer>
  );
};
