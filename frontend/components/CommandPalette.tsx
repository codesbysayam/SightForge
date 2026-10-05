'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Camera, Film, Image as ImageIcon, Scan, 
  BarChart3, FileText, Server, BookOpen, Settings,
  Maximize2, Play, Download, Plus, ArrowRight
} from 'lucide-react';
import { BRAND } from '../config/brand';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (viewId: string) => void;
  onToggleTheme?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectView,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'view-cameras',
      title: 'Go to Live Cameras',
      category: 'Navigation',
      icon: Camera,
      action: () => { onSelectView('cameras'); onClose(); },
      shortcut: 'G C'
    },
    {
      id: 'view-overview',
      title: 'Go to Overview Dashboard',
      category: 'Navigation',
      icon: Scan,
      action: () => { onSelectView('overview'); onClose(); },
      shortcut: 'G O'
    },
    {
      id: 'view-video',
      title: 'Go to Video Analysis',
      category: 'Navigation',
      icon: Film,
      action: () => { onSelectView('video-analysis'); onClose(); }
    },
    {
      id: 'view-detection',
      title: 'Go to Detection & Tracking Workspace',
      category: 'Navigation',
      icon: Scan,
      action: () => { onSelectView('detection-tracking'); onClose(); }
    },
    {
      id: 'view-analytics',
      title: 'Go to Analytics & Metrics',
      category: 'Navigation',
      icon: BarChart3,
      action: () => { onSelectView('analytics'); onClose(); }
    },
    {
      id: 'view-reports',
      title: 'Go to Reports & Exports',
      category: 'Navigation',
      icon: FileText,
      action: () => { onSelectView('reports'); onClose(); }
    },
    {
      id: 'view-system',
      title: 'Go to System & Node Status',
      category: 'Navigation',
      icon: Server,
      action: () => { onSelectView('system'); onClose(); }
    },
    {
      id: 'view-docs',
      title: 'Go to Documentation',
      category: 'Navigation',
      icon: BookOpen,
      action: () => { onSelectView('documentation'); onClose(); }
    },
    {
      id: 'view-settings',
      title: 'Go to Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => { onSelectView('settings'); onClose(); }
    }
  ];

  const filteredCommands = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or shortcut
        }
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 z-50">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-xl border border-[#D9DCD5] shadow-[0_12px_36px_rgba(0,0,0,0.12)] overflow-hidden font-sans"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#D9DCD5] bg-[#F7F7F3]">
          <Search size={16} className="text-[#747A73]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search workspace..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#1B1D1A] placeholder-[#747A73]"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#D9DCD5] text-[#747A73]">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#D9DCD5]/40 custom-scroll text-xs">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#FFF9E8] text-[#1B1D1A] font-semibold' : 'text-[#555B55] hover:bg-[#F2F3EF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={16} className={isSelected ? 'text-[#E7B900]' : 'text-[#747A73]'} />
                    <span className="truncate">{cmd.title}</span>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F2F3EF] border border-[#D9DCD5] text-[#747A73]">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-[#747A73]">
              No matching commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
