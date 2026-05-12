import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  Lock, 
  Unlock, 
  Maximize2, 
  X,
  Eye,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from './PDFCanvas';

interface ToolbarProps {
  pageNumber: number;
  numPages: number;
  scale: number;
  opacity: number;
  isLocked: boolean;
  onPageChange: (delta: number) => void;
  onScaleChange: (delta: number) => void;
  onOpacityChange: (value: number) => void;
  onToggleLock: () => void;
  onClose?: () => void;
  onLaunchPiP?: () => void;
  pipActive?: boolean;
}

export function Toolbar({
  pageNumber,
  numPages,
  scale,
  opacity,
  isLocked,
  onPageChange,
  onScaleChange,
  onOpacityChange,
  onToggleLock,
  onClose,
  onLaunchPiP,
  pipActive = false
}: ToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "fixed top-6 right-6 z-50 transition-all duration-300 w-72",
      isCollapsed ? "opacity-50 hover:opacity-100" : "opacity-100"
    )}>
      {/* Main Bar */}
      <div className={cn(
        "flex flex-col gap-4 p-5 bg-[#2b2b2b] text-white rounded-xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300",
        isCollapsed ? "h-14 overflow-hidden" : "h-auto"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[#aaa]">
          <span>Tracer PDF v1.0</span>
          <div className="flex items-center gap-2">
            <span className="bg-[#ff4d4d] text-white px-2 py-0.5 rounded text-[9px] font-bold">LIVE</span>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex flex-col gap-4">
            {/* Page Indicator */}
            <div className="bg-[#1a1a1a] p-2 rounded font-mono text-[12px] text-center border border-white/5">
              PAGE {String(pageNumber).padStart(2, '0')} OF {String(numPages || 0).padStart(2, '0')}
            </div>

            {/* Opacity Control */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[12px]">
                <span>Opacity</span>
                <span>{Math.round(opacity * 100)}%</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-[#0078d4]"
              />
            </div>

            {/* Navigation & Zoom */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[12px]">
                <span>Navigation & Zoom</span>
                <span className="font-mono text-[10px] text-[#0078d4]">{Math.round(scale * 100)}%</span>
              </div>
              
              {/* Scale Presets */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                {[1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => onScaleChange(s - scale)}
                    className={cn(
                      "text-[10px] py-1 rounded transition-colors",
                      Math.abs(scale - s) < 0.01 
                        ? "bg-[#0078d4] text-white" 
                        : "bg-[#3d3d3d] hover:bg-[#4a4a4a] text-white/70"
                    )}
                  >
                    {s * 100}%
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button 
                  disabled={pageNumber <= 1}
                  onClick={() => onPageChange(-1)}
                  className="bg-[#3d3d3d] hover:bg-[#4a4a4a] p-2 rounded flex items-center justify-center disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  disabled={pageNumber >= numPages}
                  onClick={() => onPageChange(1)}
                  className="bg-[#3d3d3d] hover:bg-[#4a4a4a] p-2 rounded flex items-center justify-center disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => onScaleChange(0.1)}
                  className="bg-[#3d3d3d] hover:bg-[#4a4a4a] p-2 rounded flex items-center justify-center transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={() => onScaleChange(-0.1)}
                  className="bg-[#3d3d3d] hover:bg-[#4a4a4a] p-2 rounded flex items-center justify-center transition-colors"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>

            {/* Modes / Actions */}
            <div className="flex flex-col gap-3 pt-3 border-t border-[#444]">
              <div className="flex gap-2">
                <button 
                  className="flex-1 bg-[#0078d4] text-[11px] font-bold py-2 rounded transition-colors"
                >
                  TRACING
                </button>
                <button 
                  onClick={onLaunchPiP}
                  className="flex-1 bg-[#3d3d3d] hover:bg-[#4a4a4a] text-[11px] font-bold py-2 rounded transition-colors"
                >
                  OVERLAY
                </button>
              </div>

              <div className="flex items-center justify-between text-[12px] text-[#00ff00]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00ff00] rounded-full shadow-[0_0_5px_#00ff00]" />
                  <span>{isLocked ? "Position Locked" : "Position Unlocked"}</span>
                </div>
                <button 
                  onClick={onToggleLock}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] text-white transition-colors",
                    isLocked ? "bg-[#0078d4]" : "bg-[#3d3d3d] hover:bg-[#4a4a4a]"
                  )}
                >
                  {isLocked ? "UNLOCK" : "LOCK"}
                </button>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-[#e81123] hover:bg-[#c40d1d] text-[11px] font-bold py-2.5 rounded mt-1 transition-colors"
              >
                CLOSE TOOL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
