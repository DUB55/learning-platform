"""
auto_proceed_marker_improved.py

- Runs only when AC is connected (stops if unplugged).
- Keeps session awake, turns display off when idle, wakes on mouse move.
- Improved End-marker detection using UIA + OCR with preprocessing and normalized matching.
- Reduced noisy cursor logs; explicit logs for critical events (END MARKER FOUND, prompt sent, power events).
"""

import time
import threading
import logging
import sys
from datetime import datetime
import ctypes
from ctypes import wintypes
import os
import traceback

# UI automation & keyboard
from pywinauto import Application, findwindows
from pywinauto.keyboard import send_keys
import pyperclip

# OCR/screenshot & imaging
from PIL import ImageGrab, Image, ImageOps, ImageFilter, ImageEnhance
import pytesseract

# ---------------- CONFIG ----------------
WINDOW_TITLE = "Antigravity"
END_MARKER = "END OF RESPONSE"  # exact text assistant should append
ALTERNATIVE_MARKERS = ["END OF RESPONSE", "END OF REPLY", "END_REPLY", "END-OF-RESPONSE"]  # variants to consider

PROCEED_PROMPT = (
    "Proceed. Continue building the project where you left off. "
    "If you are not sure what to do next, run diagnostics: find errors, fix bugs, "
    "improve code quality, add tests, improve UI/UX, add missing documentation, "
    "refactor for clarity, and implement reasonable improvements. "
    f"When you finish a reply, append exactly: {END_MARKER}"
)

# Timing
CHECK_INTERVAL = 1.0            # seconds between reading app text
KEEP_AWAKE_INTERVAL = 30.0      # seconds to refresh SetThreadExecutionState
MOUSE_POLL_INTERVAL = 0.20      # seconds to poll cursor position
IDLE_TO_OFF_SECONDS = 5.0       # seconds of idle before 

MAX_CYCLES = 0                  # 0 => infinite
OCR_FALLBACK = True
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Power monitor
POWER_POLL_INTERVAL = 5.0       # seconds

# Crop region for OCR (fractions of window): (left_ratio, top_ratio, right_ratio, bottom_ratio)
# Default focuses on lower part of window where chat usually sits
CHAT_CROP = (0.03, 0.30, 0.97, 0.96)

# OCR preprocessing
OCR_SCALE = 2.0                 # scale factor for image upscaling before OCR
OCR_AUTOCONTRAST = True
OCR_SHARPEN = True
OCR_THRESHOLD = None            # e.g. 150 to binarize; None to skip

# Marker confirmation
CONFIRM_MARKER_RECHECK_SECONDS = 1.0  # re-check after this many seconds to confirm marker presence

# Logging
LOG_FILE = "auto_proceed_marker_improved.log"
SNAPSHOT_DIR = "snapshots_on_error"

# Safety
TESSERACT_TIMEOUT = 15          # seconds (not enforced directly; for user knowledge)
# ----------------------------------------

# configure tesseract
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("auto_proceed")

# Windows constants for power/display/cursor
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

WM_SYSCOMMAND = 0x0112
SC_MONITORPOWER = 0xF170
HWND_BROADCAST = 0xFFFF

_user32 = ctypes.windll.user32
GetCursorPos = _user32.GetCursorPos
GetCursorPos.argtypes = [ctypes.POINTER(wintypes.POINT)]
GetCursorPos.restype = wintypes.BOOL

# For GetSystemPowerStatus
class SYSTEM_POWER_STATUS(ctypes.Structure):
    _fields_ = [
        ("ACLineStatus", wintypes.BYTE),
        ("BatteryFlag", wintypes.BYTE),
        ("BatteryLifePercent", wintypes.BYTE),
        ("Reserved1", wintypes.BYTE),
        ("BatteryLifeTime", wintypes.DWORD),
        ("BatteryFullLifeTime", wintypes.DWORD),
    ]

GetSystemPowerStatus = ctypes.windll.kernel32.GetSystemPowerStatus
GetSystemPowerStatus.argtypes = [ctypes.POINTER(SYSTEM_POWER_STATUS)]
GetSystemPowerStatus.restype = wintypes.BOOL

def is_ac_plugged() -> bool:
    status = SYSTEM_POWER_STATUS()
    if not GetSystemPowerStatus(ctypes.byref(status)):
        log.warning("GetSystemPowerStatus failed; assuming AC not connected.")
        return False
    return status.ACLineStatus == 1

# thread control
_stop_event = threading.Event()
_state_lock = threading.Lock()

_display_on = True
_last_cursor_pos = None
_last_move_time = None

# ---- display / keep awake ----
def set_thread_execution_state():
    try:
        ctypes.windll.kernel32.SetThreadExecutionState(
            ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
        )
    except Exception:
        log.exception("SetThreadExecutionState failed")

def keep_awake_loop():
    log.info("Keep-awake thread started.")
    while not _stop_event.is_set():
        set_thread_execution_state()
        _stop_event.wait(KEEP_AWAKE_INTERVAL)
    log.info("Keep-awake thread exiting.")

def turn_off_display():
    try:
        ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, 2)
        with _state_lock:
            global _display_on
            _display_on = False
    except Exception:
        log.exception("turn_off_display failed")

def wake_display():
    try:
        ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, -1)
    except Exception:
        pass
    try:
        pt = wintypes.POINT()
        if GetCursorPos(ctypes.byref(pt)):
            x, y = pt.x, pt.y
            _user32.SetCursorPos(x + 1, y + 1)
            time.sleep(0.02)
            _user32.SetCursorPos(x, y)
    except Exception:
        pass
    with _state_lock:
        global _display_on, _last_move_time
        _display_on = True
        _last_move_time = time.time()

# ---- mouse monitor (no noisy logs) ----
def get_cursor_pos():
    pt = wintypes.POINT()
    if GetCursorPos(ctypes.byref(pt)):
        return (pt.x, pt.y)
    return None

def mouse_monitor_loop(win_ref_getter):
    global _last_cursor_pos, _last_move_time
    _last_cursor_pos = get_cursor_pos() or (-1, -1)
    _last_move_time = time.time()
    while not _stop_event.is_set():
        cur = get_cursor_pos()
        now = time.time()
        if cur and cur != _last_cursor_pos:
            _last_cursor_pos = cur
            with _state_lock:
                _last_move_time = now
                was_off = not _display_on
            if was_off:
                wake_display()
                win = win_ref_getter()
                if win:
                    try:
                        win.set_focus()
                    except Exception:
                        pass
        else:
            with _state_lock:
                last_move = _last_move_time
                disp_on = _display_on
            if disp_on and (now - last_move) >= IDLE_TO_OFF_SECONDS:
                turn_off_display()
        _stop_event.wait(MOUSE_POLL_INTERVAL)

# ---- power monitor ----
def power_monitor_loop():
    log.info("Power-monitor thread started.")
    while not _stop_event.is_set():
        if not is_ac_plugged():
            log.warning("AC adapter unplugged — stopping automation.")
            _stop_event.set()
            try:
                wake_display()
            except Exception:
                pass
            break
        _stop_event.wait(POWER_POLL_INTERVAL)
    log.info("Power-monitor thread exiting.")

# ---- UIA / OCR helpers ----
def find_window(title_substr: str, timeout: float = 10.0):
    log.info("Searching for window with title containing: '%s'", title_substr)
    end = time.time() + timeout
    while time.time() < end and not _stop_event.is_set():
        try:
            handles = findwindows.find_windows(title_re=f".*{title_substr}.*")
            if handles:
                handle = handles[0]
                app = Application(backend="uia").connect(handle=handle)
                win = app.window(handle=handle)
                log.info("Window found: %s", win.window_text())
                return win
        except Exception:
            pass
        time.sleep(0.5)
    log.error("Window not found with title containing '%s'", title_substr)
    return None

def read_text_uia(win):
    try:
        texts = []
        descs = win.descendants(control_type="Text")
        if not descs:
            descs = win.descendants(control_type="Edit") + win.descendants(control_type="Pane")
        for d in descs:
            try:
                t = d.window_text()
                if t:
                    texts.append(t.strip())
            except Exception:
                continue
        combined = "\n".join(t for t in texts if t)
        return combined
    except Exception:
        log.exception("UIA read error")
        return ""

def ocr_preprocess_and_read(win):
    """
    Crop to CHAT_CROP region of the window, apply preprocessing and OCR.
    Returns extracted text (string). Saves debug snapshot if problem occurs.
    """
    try:
        rect = win.rectangle()
        left, top, right, bottom = rect.left, rect.top, rect.right, rect.bottom
        w = right - left
        h = bottom - top
        # apply crop ratios
        cl = int(left + CHAT_CROP[0] * w)
        ct = int(top + CHAT_CROP[1] * h)
        cr = int(left + CHAT_CROP[2] * w)
        cb = int(top + CHAT_CROP[3] * h)
        # ensure valid bounds
        cl = max(left, cl)
        ct = max(top, ct)
        cr = min(right, cr)
        cb = min(bottom, cb)
        if cr <= cl or cb <= ct:
            # fallback to full window
            cl, ct, cr, cb = left, top, right, bottom

        img = ImageGrab.grab(bbox=(cl, ct, cr, cb))

        # preprocessing
        if OCR_SCALE != 1.0:
            new_size = (int(img.width * OCR_SCALE), int(img.height * OCR_SCALE))
            img = img.resize(new_size, Image.BILINEAR)
        img = img.convert("L")  # grayscale
        if OCR_AUTOCONTRAST:
            img = ImageOps.autocontrast(img)
        if OCR_SHARPEN:
            img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
        if OCR_THRESHOLD is not None:
            img = img.point(lambda p: 255 if p > OCR_THRESHOLD else 0)

        # optionally save debug snapshot occasionally
        # img.save("debug_ocr_region.png")

        # OCR with tesseract (use single block mode)
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(img, config=custom_config)
        return text or ""
    except Exception:
        log.exception("OCR extraction error")
        # save a diagnostic screenshot if possible
        try:
            os.makedirs(SNAPSHOT_DIR, exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            path = os.path.join(SNAPSHOT_DIR, f"ocr_error_{ts}.png")
            ImageGrab.grab().save(path)
            log.info("Saved diagnostic screenshot to %s", path)
        except Exception:
            pass
        return ""

# ---- marker matching helpers ----
def normalize_text_for_match(s: str) -> str:
    if not s:
        return ""
    # uppercase, remove non-alphanumeric
    return "".join(ch for ch in s.upper() if ch.isalnum())

# prepare normalized markers
NORMALIZED_MARKERS = [normalize_text_for_match(m) for m in (ALTERNATIVE_MARKERS or [END_MARKER])]
if not NORMALIZED_MARKERS:
    NORMALIZED_MARKERS = [normalize_text_for_match(END_MARKER)]

def contains_marker_normalized(text: str) -> bool:
    if not text:
        return False
    norm = normalize_text_for_match(text)
    for nm in NORMALIZED_MARKERS:
        if not nm:
            continue
        if nm in norm:
            return True
    return False

# double-check marker by re-reading shortly after detection (avoid one-off OCR noise)
def confirm_marker(win, use_ocr: bool):
    time.sleep(CONFIRM_MARKER_RECHECK_SECONDS)
    if use_ocr:
        t2 = ocr_preprocess_and_read(win).strip()
    else:
        t2 = read_text_uia(win).strip()
    return contains_marker_normalized(t2)

# ---- sending prompt ----
def send_proceed_prompt(win, prompt):
    try:
        edits = win.descendants(control_type="Edit")
        if edits:
            ctrl = edits[-1]
            ctrl.set_focus()
            pyperclip.copy(prompt)
            send_keys("^v")
            send_keys("{ENTER}")
            log.info("Proceed prompt pasted & Enter sent (via Edit focus).")
            return True
        win.set_focus()
        pyperclip.copy(prompt)
        send_keys("^v")
        send_keys("{ENTER}")
        log.info("Proceed prompt pasted & Enter sent (via window focus).")
        return True
    except Exception:
        log.exception("Failed to send proceed prompt")
        return False

# ---- main automation loop with improved detection ----
def main_loop(win_getter):
    last_snapshot = ""
    cycles = 0
    start_time = datetime.now()

    while not _stop_event.is_set():
        if MAX_CYCLES and cycles >= MAX_CYCLES:
            log.info("Reached MAX_CYCLES (%d). Exiting.", MAX_CYCLES)
            break

        # quick power safety check
        if not is_ac_plugged():
            log.warning("AC adapter missing during main loop. Stopping.")
            _stop_event.set()
            break

        win = win_getter()
        if not win:
            log.warning("App window not found; retrying shortly.")
            time.sleep(CHECK_INTERVAL)
            continue

        # Prefer UIA read
        text_uia = read_text_uia(win).strip()
        used_ocr = False
        potential_text = text_uia

        if not text_uia and OCR_FALLBACK:
            used_ocr = True
            potential_text = ocr_preprocess_and_read(win).strip()

        if not potential_text:
            time.sleep(CHECK_INTERVAL)
            continue

        # Only check newest text part to avoid old markers in history
        # We attempt to check for marker in the combined text but ensure it's new relative to last_snapshot.
        if potential_text == last_snapshot:
            time.sleep(CHECK_INTERVAL)
            continue

        # Check normalized containment
        found = contains_marker_normalized(potential_text)
        if found:
            # Confirm to reduce false positives
            log.info("END MARKER detected preliminarily using %s.", "OCR" if used_ocr else "UIA")
            confirmed = confirm_marker(win, use_ocr=used_ocr)
            if confirmed:
                log.info("END MARKER FOUND (confirmed).")
                # send prompt
                ok = send_proceed_prompt(win, PROCEED_PROMPT)
                if ok:
                    cycles += 1
                    log.info("Proceed prompt sent successfully. cycle=%d", cycles)
                else:
                    log.error("Failed to send proceed prompt.")
                # update snapshot to avoid re-triggering on same marker
                last_snapshot = potential_text
                # small wait for assistant to start replying
                time.sleep(2)
                continue
            else:
                # may be false positive; log and continue
                log.info("Marker detection unconfirmed on recheck (possible OCR noise). Continuing.")
                # update last_snapshot to reduce flip-flop if needed, but don't count as handled
                last_snapshot = potential_text
                time.sleep(CHECK_INTERVAL)
                continue
        else:
            # No marker found
            last_snapshot = potential_text

        time.sleep(CHECK_INTERVAL)

    elapsed = datetime.now() - start_time
    log.info("Main loop exiting. cycles=%d elapsed=%s", cycles, elapsed)

# ---- helper class to hold window ref ----
class WindowRef:
    def __init__(self, title_substr):
        self.title_substr = title_substr
        self._win = None
        self._lock = threading.Lock()

    def get(self):
        with self._lock:
            try:
                if self._win:
                    _ = self._win.window_text()
                    return self._win
            except Exception:
                self._win = None
            self._win = find_window(self.title_substr, timeout=5)
            return self._win

# ---- entry point ----
def main():
    log.info("Starting improved automation (marker detection).")
    # power check
    if not is_ac_plugged():
        log.error("No AC adapter detected at startup. Exiting.")
        return
    log.info("AC adapter connected. Continuing startup.")

    # threads
    keep_thread = threading.Thread(target=keep_awake_loop, daemon=True)
    keep_thread.start()

    power_thread = threading.Thread(target=power_monitor_loop, daemon=True)
    power_thread.start()

    win_ref = WindowRef(WINDOW_TITLE)
    initial_win = win_ref.get()
    if initial_win:
        log.info("App window found at startup: %s", initial_win.window_text())
    else:
        log.warning("App window not found at startup; main loop will retry.")

    mouse_thread = threading.Thread(target=mouse_monitor_loop, args=(win_ref.get,), daemon=True)
    mouse_thread.start()

    # turn screen off at start
    try:
        turn_off_display()
    except Exception:
        log.exception("turn_off_display at startup failed")

    try:
        main_loop(win_ref.get)
    except Exception:
        log.exception("Unhandled exception in main_loop:\n%s", traceback.format_exc())
    finally:
        _stop_event.set()
        try:
            wake_display()
        except Exception:
            pass
        log.info("Automation stopped. Exiting.")

if __name__ == "__main__":
    main()
