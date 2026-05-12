# PDF Trace — Transparent PDF Overlay

A semi-transparent PDF overlay tool for tracing PDF layouts onto other applications (Microsoft Word, design tools, anything you want to copy a layout from). Ships in two flavors:

- **Web app** — React + Vite + pdfjs-dist. Runs in the browser with an "always on top" mode via the Document Picture-in-Picture API (Chrome/Edge).
- **Desktop app** — Python + PyQt6 + PyMuPDF. Native Windows overlay with true **click-through** support, so you can type in Word *through* the transparent PDF.

## Why two versions?

Browsers don't allow real click-through windows (security restriction). If you only need to *look* at the PDF while working below it, the web app is enough. If you need to *click and type through* the PDF directly into the app behind it, use the desktop version.

| Feature                  | Web | Desktop |
|--------------------------|-----|---------|
| Adjustable opacity       | ✅  | ✅      |
| Page navigation & zoom   | ✅  | ✅      |
| Always-on-top window     | ✅ (PiP) | ✅ |
| Click-through to app below | ❌ | ✅      |
| Cross-platform           | ✅  | Windows-only |
| No install needed        | ✅  | ❌      |

---

## Web app

### Prerequisites
- Node.js 18+

### Run locally
```bash
npm install
npm run dev
```
Open the URL Vite prints (defaults to `http://localhost:3000`).

### Build for production
```bash
npm run build
npm run preview
```

### Usage
1. Click the drop zone and pick a PDF.
2. Adjust opacity, zoom, and page with the floating toolbar.
3. Press **OVERLAY** to launch the Picture-in-Picture window (Chrome/Edge only) — this floats above other windows.

---

## Desktop app (Windows)

### Prerequisites
- Windows 10/11
- Python 3.8+

### Install & run
```bash
pip install PyQt6 pymupdf
python desktop_overlay.py
```

### Usage
1. Click **UPLOAD PDF** on the floating control panel.
2. Drag the overlay window over the app you want to trace into.
3. Adjust opacity / zoom / page from the controller.
4. Click **UNLOCK → LOCK** to enable click-through. While locked, mouse and keyboard input pass through the overlay to the window beneath it.

### Build a standalone .exe (optional)
A PyInstaller spec is included:
```bash
pip install pyinstaller
pyinstaller PDF_Trace_Overlay.spec
```
The bundled executable lands in `dist/PDF_Trace_Overlay.exe` (~140 MB, not committed to the repo).

---

## Project structure
```
.
├── src/                       # Web app source (React + TypeScript)
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── components/
│       ├── PDFCanvas.tsx      # pdfjs-dist renderer
│       └── Toolbar.tsx        # floating control panel
├── desktop_overlay.py         # Python/PyQt6 desktop version
├── PDF_Trace_Overlay.spec     # PyInstaller build spec
├── index.html
├── vite.config.ts
├── package.json
└── .env.example
```

## Tech stack
- **Web:** React 19, Vite 6, TypeScript, Tailwind CSS 4, pdfjs-dist 4.10, Motion, Lucide icons.
- **Desktop:** Python 3.8+, PyQt6, PyMuPDF (`fitz`).

## Notes & limitations
- The PDF.js worker is loaded from cdnjs at runtime. If you deploy this in a hardened environment, consider bundling the worker locally or adding a Subresource Integrity hash.
- The web app ships with a Vite `define` for `GEMINI_API_KEY` left over from the AI Studio template scaffolding. It is **not used anywhere in the source**. Do not put a real API key in `.env.local` unless you also remove or rework that line — Vite's `define` inlines values into the public JS bundle.
- All PDF parsing happens locally in the browser (web) or in-process (desktop). Files are never uploaded anywhere.

## License
No license file — all rights reserved by the author. Open an issue if you'd like to reuse this.
