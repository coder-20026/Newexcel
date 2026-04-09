import React from 'react';
import { Search, User, Grid, Share2, MessageSquare } from 'lucide-react';

interface HeaderProps {
  fileName: string;
  onRename: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ fileName, onRename }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempName, setTempName] = React.useState(fileName);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempName.trim()) {
      onRename(tempName.trim());
    } else {
      setTempName(fileName);
    }
  };

  return (
    <header 
      onPointerDown={(e) => e.stopPropagation()}
      className="bg-[#107c41] h-12 flex items-center justify-between px-4 text-white shrink-0 select-none"
    >
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        className="flex items-center gap-4"
      >
        <div className="p-1 hover:bg-[#0d6635] rounded cursor-pointer">
          <Grid size={20} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Excel</span>
          <div className="w-px h-4 bg-white/30 mx-1" />
          {isEditing ? (
            <input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              className="bg-[#0d6635] text-white text-sm px-2 py-0.5 rounded outline-none border-none w-40 touch-auto"
            />
          ) : (
            <h1 
              onPointerDown={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="font-medium text-sm cursor-pointer hover:bg-[#0d6635] px-2 py-0.5 rounded"
            >
              {fileName}
            </h1>
          )}
        </div>
        <div className="relative ml-4 hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70" size={14} />
          <input 
            type="text" 
            placeholder="Search" 
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-[#0d6635] border-none rounded px-8 py-1 text-xs w-64 focus:ring-1 focus:ring-white/50 outline-none placeholder:text-white/50 touch-auto"
          />
        </div>
      </div>
      
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        className="flex items-center gap-2"
      >
        <div className="p-2 hover:bg-[#0d6635] rounded cursor-pointer hidden sm:flex items-center gap-1">
          <MessageSquare size={16} />
          <span className="text-xs">Comments</span>
        </div>
        <div className="p-2 hover:bg-[#0d6635] rounded cursor-pointer flex items-center gap-1">
          <Share2 size={16} />
          <span className="text-xs hidden sm:inline">Share</span>
        </div>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ml-2 cursor-pointer border-2 border-white/20">
          <User size={18} />
        </div>
      </div>
    </header>
  );
};
