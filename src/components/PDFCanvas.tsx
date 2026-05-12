import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Set up the worker
// IMPORTANT: Sync with package version for stability
const PDF_JS_VERSION = '4.10.38'; 
const PDF_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

interface PDFCanvasProps {
  file: File | null;
  pageNumber: number;
  scale: number;
  opacity: number;
  isLocked: boolean;
  onPageLoad?: (numPages: number) => void;
  className?: string;
}

export function PDFCanvas({
  file,
  pageNumber,
  scale,
  opacity,
  isLocked,
  onPageLoad,
  className
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);

  // Load PDF
  useEffect(() => {
    if (!file) {
      setPdf(null);
      setError(null);
      return;
    }

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ 
          data: arrayBuffer
        });
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        onPageLoad?.(pdfDoc.numPages);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [file, onPageLoad]);

  // Render Page
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;

    try {
      // Cancel previous render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdf.getPage(pageNumber);
      
      // Get device pixel ratio for high-DPI displays (retina)
      const dpr = window.devicePixelRatio || 1;
      
      // Calculate viewport at the desired scale
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { alpha: false }); // Optimization for static rendering

      if (!context) return;

      // Set actual canvas dimensions to match display size * pixel ratio
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);

      // Set CSS display size to match the intended viewport
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Scale context to account for hardware pixel ratio
      context.scale(dpr, dpr);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (error: any) {
      if (error?.name === 'RenderingCancelledException') return;
      console.error('Error rendering page:', error);
    }
  }, [pdf, pageNumber, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative transition-opacity duration-200 min-h-[400px] flex items-center justify-center bg-white/5",
        isLocked ? "pointer-events-none" : "pointer-events-auto",
        className
      )}
      style={{ opacity }}
    >
      <div className="absolute top-0 left-0 right-0 p-2 bg-white/90 border-b border-[#0078d4]/20 text-[#0078d4] font-bold text-[10px] uppercase tracking-wider z-10">
        PDF Overlay: Tracing Mode Active
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-4 text-[#0078d4]">
          <div className="w-8 h-8 border-2 border-[#0078d4] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest">Loading PDF...</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-4 text-red-400 p-8 text-center max-w-sm">
          <div className="p-3 bg-red-500/10 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-sm font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        className={cn(
          "max-w-full h-auto shadow-2xl border-2 border-[#0078d4] transition-opacity duration-500",
          pdf && !isLoading ? "opacity-100" : "opacity-0 invisible absolute"
        )}
      />
    </div>
  );
}
