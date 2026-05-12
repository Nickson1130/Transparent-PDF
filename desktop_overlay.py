7# PDF Trace Desktop Overlay (Windows)
# 
# Requires:
# pip install PyQt6 pymupdf
#
# Usage:
# python desktop_overlay.py
#
# Features:
# - Transparent overlay window
# - Click-through / Interactivity toggle
# - PDF Navigation (Next/Prev)
# - Zoom & Opacity controls
# - Always on Top

import sys
import fitz  # PyMuPDF
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QPushButton, QSlider, QLabel, QFileDialog, QFrame, QLineEdit)
from PyQt6.QtCore import Qt, QPoint, QRect
from PyQt6.QtGui import QImage, QPixmap, QColor, QFont, QIntValidator

class ControlPanel(QWidget):
    """The interactive floating toolbar that never locks."""
    def __init__(self, overlay):
        super().__init__()
        self.overlay = overlay
        
        # Window Setup
        self.setWindowTitle("PDF Trace Controller")
        self.setWindowFlags(Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Tool | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setStyleSheet("""
            QWidget {
                background-color: #2b2b2b;
                color: white;
                border-radius: 12px;
                border: 1px solid #444;
            }
            QPushButton {
                background-color: #3d3d3d;
                border: none;
                padding: 8px;
                border-radius: 6px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #4a4a4a;
            }
            QPushButton#lockBtn[locked="true"] {
                background-color: #0078d4;
            }
            QLabel {
                border: none;
                font-size: 11px;
            }
            QLineEdit {
                background-color: #1e1e1e;
                border: 1px solid #444;
                padding: 4px;
                border-radius: 4px;
                color: white;
                font-size: 11px;
            }
            QLineEdit:focus {
                border: 1px solid #0078d4;
            }
        """)
        
        self.layout = QVBoxLayout(self)
        
        # Header / Drag handle area
        self.header = QLabel("PDF TRACE CONTROLLER")
        self.header.setStyleSheet("color: #aaa; font-size: 9px; letter-spacing: 1px;")
        self.header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.layout.addWidget(self.header)

        # File Actions
        self.btn_open = QPushButton("UPLOAD PDF")
        self.btn_open.clicked.connect(self.overlay.select_file)
        self.layout.addWidget(self.btn_open)

        # Navigation
        nav_layout = QHBoxLayout()
        self.btn_prev = QPushButton("<")
        self.btn_prev.clicked.connect(self.overlay.prev_page)
        self.lbl_page = QLabel("0 / 0")
        self.lbl_page.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.btn_next = QPushButton(">")
        self.btn_next.clicked.connect(self.overlay.next_page)
        nav_layout.addWidget(self.btn_prev)
        nav_layout.addWidget(self.lbl_page)
        nav_layout.addWidget(self.btn_next)
        self.layout.addLayout(nav_layout)

        # Zoom
        zoom_layout = QHBoxLayout()
        self.btn_zoom_out = QPushButton("-")
        self.btn_zoom_out.clicked.connect(lambda: self.overlay.update_zoom(-0.1))
        self.lbl_zoom = QLineEdit("100")
        self.lbl_zoom.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.lbl_zoom.setValidator(QIntValidator(10, 1000, self))
        self.lbl_zoom.setMaxLength(4)
        self.lbl_zoom.editingFinished.connect(self.apply_zoom_text)
        self.lbl_zoom.returnPressed.connect(self.apply_zoom_text)
        self.btn_zoom_in = QPushButton("+")
        self.btn_zoom_in.clicked.connect(lambda: self.overlay.update_zoom(0.1))
        zoom_layout.addWidget(self.btn_zoom_out)
        zoom_layout.addWidget(self.lbl_zoom)
        zoom_layout.addWidget(QLabel("%"))
        zoom_layout.addWidget(self.btn_zoom_in)
        self.layout.addLayout(zoom_layout)

        # Opacity
        self.layout.addWidget(QLabel("OPACITY"))
        self.sld_opacity = QSlider(Qt.Orientation.Horizontal)
        self.sld_opacity.setRange(10, 100)
        self.sld_opacity.setValue(50)
        self.sld_opacity.valueChanged.connect(self.overlay.update_opacity)
        self.layout.addWidget(self.sld_opacity)

        # Lock Toggle (CRITICAL: This is outside the overlay window)
        self.btn_lock = QPushButton("UNLOCK")
        self.btn_lock.setProperty("locked", "false")
        self.btn_lock.clicked.connect(self.toggle_lock)
        self.layout.addWidget(self.btn_lock)

        self.btn_close = QPushButton("CLOSE ALL")
        self.btn_close.setStyleSheet("background-color: #e81123;")
        self.btn_close.clicked.connect(QApplication.instance().quit)
        self.layout.addWidget(self.btn_close)

        self.setFixedSize(220, 320)
        self.drag_pos = QPoint()

    def apply_zoom_text(self):
        text = self.lbl_zoom.text().strip().rstrip('%')
        if not text:
            self.lbl_zoom.setText(str(int(self.overlay.zoom * 100)))
            return
        try:
            value = int(text)
        except ValueError:
            self.lbl_zoom.setText(str(int(self.overlay.zoom * 100)))
            return
        value = max(10, min(1000, value))
        self.overlay.set_zoom(value / 100.0)

    def toggle_lock(self):
        is_locked = self.overlay.toggle_lock()
        self.btn_lock.setText("LOCKED (CLICK-THRU)" if is_locked else "UNLOCKED")
        self.btn_lock.setProperty("locked", "true" if is_locked else "false")
        self.btn_lock.style().unpolish(self.btn_lock)
        self.btn_lock.style().polish(self.btn_lock)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self.drag_pos)

class OverlayWindow(QMainWindow):
    """The large PDF overlay that can become click-through."""
    def __init__(self):
        super().__init__()
        self.pdf_doc = None
        self.page_num = 0
        self.zoom = 1.0
        self.opacity = 0.5
        self.is_locked = False
        self.controller = None

        # Window Setup
        self.setWindowTitle("PDF Trace Overlay")
        self.setWindowFlags(Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.resize(800, 1000)

        self.canvas = QLabel(self)
        self.canvas.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setCentralWidget(self.canvas)
        
        self.setWindowOpacity(self.opacity)
        self.drag_pos = QPoint()

    def select_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Open PDF", "", "PDF Files (*.pdf)")
        if file_path:
            self.pdf_doc = fitz.open(file_path)
            self.page_num = 0
            self.render_page()

    def render_page(self):
        if not self.pdf_doc: return
        page = self.pdf_doc.load_page(self.page_num)
        pix = page.get_pixmap(matrix=fitz.Matrix(self.zoom, self.zoom))
        img = QImage(pix.samples, pix.width, pix.height, pix.stride, QImage.Format.Format_RGB888)
        self.canvas.setPixmap(QPixmap.fromImage(img))
        self.canvas.resize(pix.width, pix.height)
        self.adjustSize()
        if self.controller:
            self.controller.lbl_page.setText(f"{self.page_num + 1} / {self.pdf_doc.page_count}")

    def update_zoom(self, delta):
        self.zoom = max(0.1, min(10.0, self.zoom + delta))
        self.render_page()
        if self.controller:
            self.controller.lbl_zoom.setText(str(int(round(self.zoom * 100))))

    def set_zoom(self, value):
        self.zoom = max(0.1, min(10.0, value))
        self.render_page()
        if self.controller:
            self.controller.lbl_zoom.setText(str(int(round(self.zoom * 100))))

    def update_opacity(self, value):
        self.opacity = value / 100.0
        self.setWindowOpacity(self.opacity)

    def prev_page(self):
        if self.pdf_doc and self.page_num > 0:
            self.page_num -= 1
            self.render_page()

    def next_page(self):
        if self.pdf_doc and self.page_num < self.pdf_doc.page_count - 1:
            self.page_num += 1
            self.render_page()

    def toggle_lock(self):
        self.is_locked = not self.is_locked
        if self.is_locked:
            self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowTransparentForInput)
        else:
            self.setWindowFlags(self.windowFlags() & ~Qt.WindowType.WindowTransparentForInput)
        self.show()
        return self.is_locked

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton and not self.is_locked:
            self.drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.MouseButton.LeftButton and not self.is_locked:
            self.move(event.globalPosition().toPoint() - self.drag_pos)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    overlay = OverlayWindow()
    panel = ControlPanel(overlay)
    overlay.controller = panel
    overlay.show()
    panel.show()
    # Position panel to the right of overlay
    panel.move(overlay.x() + overlay.width() + 10, overlay.y())
    sys.exit(app.exec())
