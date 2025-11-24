"""
auto_proceed_screenoff.py

- Keeps the session awake (SetThreadExecutionState).
- Turns the display off.
- Wakes the display when the user moves the mouse cursor.
- Monitors a desktop chat app window for assistant output (UIA first, OCR fallback).
- When END_MARKER is found in assistant's response, automatically pastes & sends PROCEED_PROMPT.
"""

import time
import threading
import logging
import sys
from datetime import datetime
import ctypes
from ctypes import wintypes

# UI automation & input
from pywinauto import Application, findwindows
from pywinauto.keyboard import send_keys
import pyperclip

# OCR/screenshot fallback
from PIL import ImageGrab
import pytesseract

# ---------------- CONFIG ----------------
WINDOW_TITLE = "Antigravity"   # substring of the app window title
END_MARKER = "END OF RESPONSE"  # assistant must append this EXACTLY
PROCEED_PROMPT = (
    "Proceed. Continue building the project where you left off. "
    "If you are not sure what to do next, run diagnostics: find errors, fix bugs, "
    "improve code quality, add tests, improve UI/UX, add missing documentation, "
    "refactor for clarity, and implement reasonable improvements. "
    f"When you finish a reply, append exactly: {END_MARKER}"
)

# Behavior/timing
CHECK_INTERVAL = 1.0        # seconds between scans
KEEP_AWAKE_INTERVAL = 30.0  # seconds for SetThreadExecutionState refresh
MOUSE_POLL_INTERVAL = 0.25  # seconds to poll cursor position for "wake"
MAX_CYCLES = 0              # 0 => infinite, >0 => stop after that many sends
OCR_FALLBACK = True         # use OCR if UIA returns no text
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"  # change if needed

# Logging
LOG_FILE = "auto_proceed_screenoff.log"
# ----------------------------------------

# Configure pytesseract path
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

# Keep threads controllable
_stop_event = threading.Event()


def set_thread_execution_state():
    """Prevent the system from sleeping / turning off automatically."""
    try:
        res = ctypes.windll.kernel32.SetThreadExecutionState(
            ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
        )
        if res == 0:
            log.warning("SetThreadExecutionState failed (returned 0).")
        else:
            log.debug("SetThreadExecutionState success: %s", res)
    except Exception as e:
        log.exception("SetThreadExecutionState exception: %s", e)


def keep_awake_loop():
    """Background thread that repeatedly calls SetThreadExecutionState."""
    log.info("Keep-awake thread started (interval %s s).", KEEP_AWAKE_INTERVAL)
    while not _stop_event.is_set():
        set_thread_execution_state()
        _stop_event.wait(KEEP_AWAKE_INTERVAL)
    log.info("Keep-awake thread exiting.")


def turn_off_display():
    """Turn the monitor(s) off. (Broadcast WM_SYSCOMMAND with SC_MONITORPOWER=2)"""
    try:
        ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, 2)
        log.info("Sent command to turn off display.")
    except Exception as e:
        log.exception("Failed to turn off display: %s", e)


def wake_display():
    """
    Try to wake the display.
    Strategy:
      - Broadcast SC_MONITORPOWER with wParam = -1 (monitor on)
      - Then simulate a tiny mouse move (mouse_event) to guarantee wake
    """
    try:
        ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, -1)
    except Exception:
        pass

    # simulate minimal mouse move using SetCursorPos relative small move and back
    try:
        pt = wintypes.POINT()
        if GetCursorPos(ctypes.byref(pt)):
            x, y = pt.x, pt.y
            # move by +1,+1 and back
            _user32.SetCursorPos(x + 1, y + 1)
            time.sleep(0.02)
            _user32.SetCursorPos(x, y)
        else:
            # fallback to mouse_event if SetCursorPos unavailable
            ctypes.windll.user32.mouse_event(1, 0, 0, 0, 0)
    except Exception:
        pass
    log.info("Sent wake signal (display should wake on mouse/keyboard activity).")


def get_cursor_pos():
    pt = wintypes.POINT()
    if GetCursorPos(ctypes.byref(pt)):
        return (pt.x, pt.y)
    return None


def monitor_mouse_for_wake():
    """
    Poll the cursor position; when the user moves the cursor, call wake_display() and refocus the app window.
    This thread runs continuously.
    """
    log.info("Mouse-monitor thread started.")
    prev = get_cursor_pos()
    if prev is None:
        prev = (-1, -1)
    while not _stop_event.is_set():
        cur = get_cursor_pos()
        if cur and cur != prev:
            log.info("Cursor movement detected: %s -> %s", prev, cur)
            wake_display()
            # small cooldown to avoid repeated wake calls
            time.sleep(1.0)
        prev = cur
        _stop_event.wait(MOUSE_POLL_INTERVAL)
    log.info("Mouse-monitor thread exiting.")


# --- UIA/OCR helper functions --- #
def find_window(title_substr: str, timeout: float = 10.0):
    """Find and return a pywinauto window wrapper by title substring (UIA backend)."""
    log.info("Searching for window with title containing: '%s'", title_substr)
    end = time.time() + timeout
    while time.time() < end:
        try:
            handles = findwindows.find_windows(title_re=f".*{title_substr}.*")
            if handles:
                handle = handles[0]
                app = Application(backend="uia").connect(handle=handle)
                win = app.window(handle=handle)
                log.info("Connected to window: %s", win.window_text())
                return win
        except Exception:
            pass
        time.sleep(0.5)
    log.error("Window not found with title containing '%s'", title_substr)
    return None


def read_text_uia(win):
    """Read visible text from the window via UIA (collect Text controls)."""
    try:
        texts = []
        descs = win.descendants(control_type="Text")
        if not descs:
            # try also Edit/Panes
            descs = win.descendants(control_type="Edit") + win.descendants(control_type="Pane")
        for d in descs:
            try:
                t = d.window_text()
                if t:
                    texts.append(t.strip())
            except Exception:
                continue
        combined = "\n".join(x for x in texts if x)
        return combined
    except Exception as e:
        log.exception("UIA read failed: %s", e)
        return ""


def read_text_ocr(win):
    """Screenshot the window region and run Tesseract OCR."""
    try:
        rect = win.rectangle()
        left, top, right, bottom = rect.left, rect.top, rect.right, rect.bottom
        img = ImageGrab.grab(bbox=(left, top, right, bottom))
        text = pytesseract.image_to_string(img)
        return text or ""
    except Exception as e:
        log.exception("OCR read failed: %s", e)
        return ""


def send_proceed_prompt(win, prompt):
    """Paste prompt via clipboard and press Enter. Attempts to focus an Edit control first."""
    try:
        # try to find an Edit control to focus
        edits = win.descendants(control_type="Edit")
        if edits:
            ctrl = edits[-1]
            ctrl.set_focus()
            pyperclip.copy(prompt)
            send_keys("^v")
            send_keys("{ENTER}")
            return True
        # fallback: focus window and paste
        win.set_focus()
        pyperclip.copy(prompt)
        send_keys("^v")
        send_keys("{ENTER}")
        return True
    except Exception as e:
        log.exception("Failed to send prompt: %s", e)
        return False


# --- Main loop --- #
def main():
    log.info("Starting automation: keep-awake + screen-off + auto-proceed")
    # start keep-awake thread
    keep_thread = threading.Thread(target=keep_awake_loop, daemon=True)
    keep_thread.start()

    # start mouse-monitor thread (wakes display on movement)
    mouse_thread = threading.Thread(target=monitor_mouse_for_wake, daemon=True)
    mouse_thread.start()

    try:
        # find the app window
        win = find_window(WINDOW_TITLE, timeout=15)
        if not win:
            log.error("App window not found. Exiting.")
            return

        # turn the display off now
        turn_off_display()

        last_snapshot = ""
        cycles = 0
        start_time = datetime.now()

        while True:
            if MAX_CYCLES and cycles >= MAX_CYCLES:
                log.info("Reached MAX_CYCLES (%d). Exiting loop.", MAX_CYCLES)
                break

            # read text via UIA
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

            # We have new/changed text
            log.info("Detected new text (OCR=%s). Checking for END_MARKER...", used_ocr)
            if END_MARKER in text and END_MARKER not in last_snapshot:
                snippet = text[-800:] if len(text) > 800 else text
                log.info("END_MARKER found. Snippet: %s", snippet.replace("\n", " ")[:350])
                ok = send_proceed_prompt(win, PROCEED_PROMPT)
                if ok:
                    cycles += 1
                    log.info("Sent proceed prompt (cycle %d).", cycles)
                else:
                    log.error("Failed to send proceed prompt. Aborting.")
                    break
                last_snapshot = text
                # give the assistant a moment to start replying
                time.sleep(2)
            else:
                last_snapshot = text

            time.sleep(CHECK_INTERVAL)

    except KeyboardInterrupt:
        log.info("Interrupted by user (KeyboardInterrupt).")
    except Exception as e:
        log.exception("Unhandled exception in main loop: %s", e)
    finally:
        _stop_event.set()
        # wake display on exit so you don't leave it off
        try:
            wake_display()
        except Exception:
            pass
        elapsed = datetime.now() - start_time
        log.info("Exiting. cycles=%d elapsed=%s", cycles, elapsed)


if __name__ == "__main__":
    main()
