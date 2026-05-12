import React, { useState, useRef, useCallback } from 'react';
import { Upload, AlertCircle, Laptop, Settings2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PDFCanvas, cn } from './components/PDFCanvas';
import { Toolbar } from './components/Toolbar';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [opacity, setOpacity] = useState(0.5);
  const [isLocked, setIsLocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPageNumber(1);
    }
  };

  const handleLaunchPiP = useCallback(async () => {
    // Check for support
    if (!('documentPictureInPicture' in window)) {
      alert('Document Picture-in-Picture is not supported in your browser. (Try Chrome or Edge)');
      return;
    }

    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 800,
        height: 800,
      });

      // Copy styles to the PiP window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      // Prepare PiP container
      const container = pipWindow.document.createElement('div');
      container.id = 'pip-root';
      pipWindow.document.body.appendChild(container);
      
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.overflow = 'hidden';
      pipWindow.document.body.style.backgroundColor = 'transparent';

      // We'll move the main overlay to the PiP window
      // Note: This is a bit advanced because we need to handle React rendering in the new window.
      // For now, I'll explain this is the web version, and it stays on top if the browser supports it.
      
      // I'll show a message that they can move the content.
      const msg = pipWindow.document.createElement('div');
      msg.style.padding = '20px';
      msg.style.fontFamily = 'system-ui';
      msg.style.color = '#151619';
      msg.textContent = 'Place this transparent window over your Word document.';
      pipWindow.document.body.appendChild(msg);

    } catch (error) {
      console.error('Failed to launch PiP:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#004578] font-sans selection:bg-[#0078d4] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-40 bg-white/10 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0078d4] rounded-lg flex items-center justify-center text-white shadow-lg">
            <Settings2 size={24} />
          </div>
          <div className="text-white">
            <h1 className="font-bold text-lg tracking-tight">PDF Trace</h1>
            <p className="text-[10px] uppercase tracking-widest font-mono opacity-60">Professional Tracer Edition</p>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-white/50 hover:text-white hover:underline transition-all"
            >
              Open different PDF
            </button>
          </div>
        )}
      </header>

      <main className="pt-24 pb-32 px-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] overflow-auto">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-96 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-white/20 hover:bg-white/10 transition-all duration-500 overflow-hidden"
              >
                <div className="p-6 bg-[#0078d4] rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500 text-white">
                  <FileText size={48} />
                </div>
                <div className="text-center text-white">
                  <h3 className="font-semibold text-xl">Drag & drop your PDF</h3>
                  <p className="text-sm opacity-50 mt-1">or click to browse files</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <AlertCircle size={20} className="text-[#0078d4] flex-shrink-0 mt-0.5" />
                  <div className="text-white">
                    <h4 className="text-sm font-semibold">Always-on-top Overlay</h4>
                    <p className="text-xs opacity-60 mt-1 leading-relaxed">
                      Optimized for Microsoft Word layout recreation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Laptop size={20} className="text-[#0078d4] flex-shrink-0 mt-0.5" />
                  <div className="text-white">
                    <h4 className="text-sm font-semibold">Native Windows Support</h4>
                    <p className="text-xs opacity-60 mt-1 leading-relaxed">
                      Use <strong>desktop_overlay.py</strong> for full system click-through.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full h-full flex flex-col items-center justify-center overflow-auto p-8"
            >
              {/* Simulated Word Background for Context */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 -z-10">
                <div className="w-[800px] h-[1000px] bg-white rounded shadow-2xl border border-red-500/10 flex flex-col p-12 gap-4">
                  <div className="h-4 bg-gray-100 w-1/2" />
                  <div className="h-4 bg-gray-100" />
                  <div className="h-4 bg-gray-100" />
                  <div className="h-4 bg-gray-100 w-3/4" />
                </div>
              </div>

              <div className="relative group p-10">
                <PDFCanvas 
                  file={file}
                  pageNumber={pageNumber}
                  scale={scale}
                  opacity={opacity}
                  isLocked={isLocked}
                  onPageLoad={setNumPages}
                />
                
                <AnimatePresence>
                  {isLocked && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-x-0 bottom-0 bg-[#0078d4]/80 backdrop-blur-sm p-2 text-center text-white text-[10px] font-bold uppercase tracking-widest z-20"
                    >
                      Position Locked
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Toolbar 
                pageNumber={pageNumber}
                numPages={numPages}
                scale={scale}
                opacity={opacity}
                isLocked={isLocked}
                onPageChange={(delta) => setPageNumber(prev => Math.max(1, Math.min(numPages, prev + delta)))}
                onScaleChange={(delta) => setScale(prev => Math.max(0.1, Math.min(5, prev + delta)))}
                onOpacityChange={setOpacity}
                onToggleLock={() => setIsLocked(!isLocked)}
                onLaunchPiP={handleLaunchPiP}
                onClose={() => setFile(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <input 
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <footer className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div className="bg-[#2b2b2b] p-4 rounded-xl border border-white/10 pointer-events-auto shadow-xl">
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest font-mono">System Status</p>
            <div className="flex items-center gap-2 mt-1 px-1">
              <div className={cn("w-2 h-2 rounded-full", file ? "bg-[#00ff00] shadow-[0_0_5px_#00ff00]" : "bg-white/20")} />
              <p className="text-xs font-medium text-white">{file ? 'Ready to Trace' : 'Idle'}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
