"""
auto_proceed_screenoff_idle5.py

- Keeps the session awake (SetThreadExecutionState).
- Turns display off initially.
- Wakes display when cursor moves, refocuses the target app window.
- If cursor stays in the same spot for IDLE_TO_OFF_SECONDS (5s), turns display off again.
- Automates a desktop chat app: detects END_MARKER in assistant output and sends PROCEED_PROMPT.
"""

import time
import threading
import logging
import sys
from datetime import datetime
import ctypes
from ctypes import wintypes

# UI automation & keyboard
from pywinauto import Application, findwindows
from pywinauto.keyboard import send_keys
import pyperclip

# OCR/screenshot fallback
from PIL import ImageGrab
import pytesseract

# ---------------- CONFIG ----------------
WINDOW_TITLE = "Antigravity"   # substring of your app window title (case-insensitive)
END_MARKER = "END OF RESPONSE"  # assistant must append this EXACTLY
PROCEED_PROMPT = (
    "Proceed. Continue building the project where you left off. "
    "If you are not sure what to do next, run diagnostics: find errors, fix bugs, "
    "improve code quality, add tests, improve UI/UX, add missing documentation, "
    "refactor for clarity, and implement reasonable improvements. "
    f"When you finish a reply, append exactly: {END_MARKER}"
)

# Behavior/timing
CHECK_INTERVAL = 1.0            # seconds between reading app text
KEEP_AWAKE_INTERVAL = 30.0      # seconds: refresh SetThreadExecutionState
MOUSE_POLL_INTERVAL = 0.20      # how often to poll cursor position
IDLE_TO_OFF_SECONDS = 5.0       # when cursor stable this long, turn display off again
MAX_CYCLES = 0                  # 0 => infinite. Set >0 to limit sends
OCR_FALLBACK = True             # use OCR if UIA returns no text
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"  # change if needed

# Logging
LOG_FILE = "auto_proceed_screenoff_idle5.log"
# ----------------------------------------

# Configure pytesseract path (if using OCR)
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("auto_proceed")

# Windows API constants
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

WM_SYSCOMMAND = 0x0112
SC_MONITORPOWER = 0xF170
HWND_BROADCAST = 0xFFFF

# For GetCursorPos
_user32 = ctypes.windll.user32
GetCursorPos = _user32.GetCursorPos
GetCursorPos.argtypes = [ctypes.POINTER(wintypes.POINT)]
GetCursorPos.restype = wintypes.BOOL

# Thread control
_stop_event = threading.Event()
_state_lock = threading.Lock()

# Shared state for display and cursor
_display_on = True        # assume display starts on; we will turn it off at start
_last_cursor_pos = None
_last_move_time = None

# Helper functions for Windows display/power
def set_thread_execution_state():
    """Prevent the system from sleeping / turning off automatically."""
    try:
        res = ctypes.windll.kernel32.SetThreadExecutionState(
            ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
        )
        if res == 0:
            log.warning("SetThreadExecutionState returned 0 (failure).")
        else:
            log.debug("SetThreadExecutionState ok: %s", res)
    except Exception as e:
        log.exception("SetThreadExecutionState exception: %s", e)

def turn_off_display():
    """Turn the monitor(s) off (SC_MONITORPOWER, wParam=2)."""
    try:
        ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, 2)
        log.info("Sent command to turn off display.")
        with _state_lock:
            global _display_on
            _display_on = False
    except Exception as e:
        log.exception("Failed to turn off display: %s", e)

def wake_display():
    """Try to wake the display and nudge the cursor a tiny bit to ensure wake."""
    try:
        # Request monitor on
        ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, -1)
    except Exception:
        pass
    try:
        # small cursor nudge: move +1,+1 then back
        pt = wintypes.POINT()
        if GetCursorPos(ctypes.byref(pt)):
            x, y = pt.x, pt.y
            _user32.SetCursorPos(x + 1, y + 1)
            time.sleep(0.02)
            _user32.SetCursorPos(x, y)
        else:
            # as fallback, call mouse_event (no-op in many contexts but harmless)
            ctypes.windll.user32.mouse_event(1, 0, 0, 0, 0)
    except Exception:
        pass
    with _state_lock:
        global _display_on, _last_move_time
        _display_on = True
        _last_move_time = time.time()
    log.info("Wake signal sent; display_on set True.")

def get_cursor_pos():
    pt = wintypes.POINT()
    if GetCursorPos(ctypes.byref(pt)):
        return (pt.x, pt.y)
    return None

# Keep-awake thread
def keep_awake_loop():
    log.info("Keep-awake thread started (interval %s s).", KEEP_AWAKE_INTERVAL)
    while not _stop_event.is_set():
        set_thread_execution_state()
        _stop_event.wait(KEEP_AWAKE_INTERVAL)
    log.info("Keep-awake thread exiting.")

# Mouse/idle monitor thread: detects movement, wakes display, turns off after idle
def mouse_monitor_loop(win_ref_getter):
    """
    win_ref_getter: callable that returns the current pywinauto window wrapper (or None).
    Monitors the cursor and toggles display on/off:
      - when cursor moves -> wake display & refocus app
      - when cursor stable for IDLE_TO_OFF_SECONDS -> turn display off
    """
    global _last_cursor_pos, _last_move_time
    log.info("Mouse-monitor thread started.")
    _last_cursor_pos = get_cursor_pos()
    if _last_cursor_pos is None:
        _last_cursor_pos = (-1, -1)
    _last_move_time = time.time()

    while not _stop_event.is_set():
        cur = get_cursor_pos()
        now = time.time()
        if cur:
            if cur != _last_cursor_pos:
                # movement detected
                log.info("Cursor moved %s -> %s", _last_cursor_pos, cur)
                _last_cursor_pos = cur
                with _state_lock:
                    _last_move_time = now
                    was_off = not _display_on
                if was_off:
                    # wake display and refocus the app
                    wake_display()
                    try:
                        win = win_ref_getter()
                        if win:
                            try:
                                # set focus back to app window
                                win.set_focus()
                                log.info("Refocused app window after wake.")
                            except Exception:
                                log.debug("Failed to set focus to app window on wake.", exc_info=True)
                    except Exception:
                        log.debug("win_ref_getter error", exc_info=True)
            else:
                # no movement since last poll; check idle timeout
                with _state_lock:
                    last_move = _last_move_time
                    disp_on = _display_on
                if disp_on and (now - last_move) >= IDLE_TO_OFF_SECONDS:
                    log.info("Cursor stable for %.1f s -> turning display off.", IDLE_TO_OFF_SECONDS)
                    turn_off_display()
            # continue polling
        else:
            log.debug("Could not read cursor position.")
        _stop_event.wait(MOUSE_POLL_INTERVAL)
    log.info("Mouse-monitor thread exiting.")

# UIA / OCR reading helpers
def find_window(title_substr: str, timeout: float = 10.0):
    """Find and return a pywinauto window wrapper by title substring."""
    log.info("Searching for window with title containing: '%s'", title_substr)
    end = time.time() + timeout
    while time.time() < end and not _stop_event.is_set():
        try:
            handles = findwindows.find_windows(title_re=f".*{title_substr}.*")
            if handles:
                handle = handles[0]
                app = Application(backend="uia").connect(handle=handle)
                win = app.window(handle=handle)
                log.info("Connected to window: %s", win.window_text())
                return win
        except Exception:
            # ignore and retry
            pass
        time.sleep(0.5)
    log.error("Window not found with title containing '%s'", title_substr)
    return None

def read_text_uia(win):
    """Gather visible text via UIA Text controls (best-effort)."""
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
        return "\n".join(t for t in texts if t)
    except Exception as e:
        log.exception("UIA read error: %s", e)
        return ""

def read_text_ocr(win):
    """Screenshot the app window and run Tesseract OCR on it."""
    try:
        rect = win.rectangle()
        left, top, right, bottom = rect.left, rect.top, rect.right, rect.bottom
        img = ImageGrab.grab(bbox=(left, top, right, bottom))
        text = pytesseract.image_to_string(img)
        return text or ""
    except Exception as e:
        log.exception("OCR read error: %s", e)
        return ""

def send_proceed_prompt(win, prompt):
    """Paste the prompt via clipboard and press Enter. Focus an Edit control if available."""
    try:
        # Prefer focusing the last Edit control
        edits = win.descendants(control_type="Edit")
        if edits:
            ctrl = edits[-1]
            ctrl.set_focus()
            pyperclip.copy(prompt)
            send_keys("^v")
            send_keys("{ENTER}")
            return True
        # Fallback: focus window and paste
        win.set_focus()
        pyperclip.copy(prompt)
        send_keys("^v")
        send_keys("{ENTER}")
        return True
    except Exception as e:
        log.exception("Failed to send prompt: %s", e)
        return False

# Main automation loop
def main_loop(win_getter):
    """
    Main automation loop: reads app text and checks for END_MARKER.
    When found, sends PROCEED_PROMPT. Uses UIA then OCR fallback.
    """
    last_snapshot = ""
    cycles = 0
    start_time = datetime.now()

    while not _stop_event.is_set():
        if MAX_CYCLES and cycles >= MAX_CYCLES:
            log.info("Reached MAX_CYCLES (%d). Exiting automation loop.", MAX_CYCLES)
            break

        win = win_getter()
        if not win:
            log.warning("App window lost; attempting to find it again.")
            win = find_window(WINDOW_TITLE, timeout=10)
            if not win:
                log.error("App window still not found; sleeping before retry.")
                time.sleep(CHECK_INTERVAL)
                continue

        # Read via UIA first
        text = read_text_uia(win).strip()
        used_ocr = False
        if not text and OCR_FALLBACK:
            used_ocr = True
            text = read_text_ocr(win).strip()

        if not text:
            time.sleep(CHECK_INTERVAL)
            continue

        if text == last_snapshot:
            time.sleep(CHECK_INTERVAL)
            continue

        log.info("Detected new/changed text (OCR=%s). Checking for END_MARKER...", used_ocr)
        if END_MARKER in text and END_MARKER not in last_snapshot:
            snippet = text[-800:] if len(text) > 800 else text
            log.info("END_MARKER found. Snippet: %s", snippet.replace("\n", " ")[:360])
            ok = send_proceed_prompt(win, PROCEED_PROMPT)
            if ok:
                cycles += 1
                log.info("Sent proceed prompt (cycle %d).", cycles)
            else:
                log.error("Failed to send proceed prompt. Aborting main loop.")
                break
            last_snapshot = text
            # small delay to let assistant start replying
            time.sleep(2)
        else:
            last_snapshot = text

        time.sleep(CHECK_INTERVAL)

    elapsed = datetime.now() - start_time
    log.info("Main loop exiting. cycles=%d elapsed=%s", cycles, elapsed)

# Helper to return the same pywinauto window object (refresh if needed)
class WindowRef:
    def __init__(self, title_substr):
        self.title_substr = title_substr
        self._win = None
        self._lock = threading.Lock()

    def get(self):
        with self._lock:
            try:
                if self._win:
                    # try a cheap operation to see if window still exists
                    _ = self._win.window_text()
                    return self._win
            except Exception:
                self._win = None
            # find again
            self._win = find_window(self.title_substr, timeout=5)
            return self._win

# Entry point
def main():
    log.info("Starting automation with display-off/idle-off behavior (idle=%ss).", IDLE_TO_OFF_SECONDS)

    # start keep-awake thread
    keep_thread = threading.Thread(target=keep_awake_loop, daemon=True)
    keep_thread.start()

    # create window ref container
    win_ref = WindowRef(WINDOW_TITLE)
    # attempt initial find
    win = win_ref.get()
    if not win:
        log.error("Could not find the app window on startup. Make sure the app is open and WINDOW_TITLE is correct.")
        # still continue and let main_loop try to find it later
    else:
        log.info("App window found on startup: %s", win.window_text())

    # start mouse monitor thread (wakes on movement & turns off after idle)
    mouse_thread = threading.Thread(target=mouse_monitor_loop, args=(win_ref.get,), daemon=True)
    mouse_thread.start()

    # turn off display immediately (so screen goes dark)
    try:
        turn_off_display()
    except Exception:
        log.exception("Error while trying to turn off display at startup.")

    try:
        # run main automation loop (blocks here)
        main_loop(win_ref.get)
    except KeyboardInterrupt:
        log.info("Interrupted by user (KeyboardInterrupt).")
    except Exception as e:
        log.exception("Unhandled exception in main: %s", e)
    finally:
        # signal threads to stop and clean up
        _stop_event.set()
        # wake display on exit so you don't leave it off by accident
        try:
            wake_display()
        except Exception:
            pass
        log.info("Automation stopped. Exiting.")

if __name__ == "__main__":
    main()
