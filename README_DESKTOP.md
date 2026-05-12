# PDF Trace Desktop Mode

This project includes a native Python version of the tool for users on Windows who need a "true" transparent overlay with click-through support.

## Prerequisites
- Windows 10/11
- Python 3.8+

## Setup & Running
1. Open a terminal or command prompt.
2. Install the necessary dependencies:
   ```bash
   pip install PyQt6 pymupdf
   ```
3. Run the application:
   ```bash
   python desktop_overlay.py
   ```

## Why use the Python version?
While the web version provides an excellent interface and an "Always on top" mode via the Document Picture-in-Picture API, browsers currently have security restrictions that prevent "click-through" functionality (clicking Word content directly through a transparent window). 

The Python version uses native Windows APIs to allow you to:
- Lock the window in place.
- Make the window ignore mouse events so you can type in Word directly beneath it.
- Maintain high performance with large PDF files.
