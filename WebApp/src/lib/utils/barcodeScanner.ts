import { useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// USB barcode scanners act as keyboards and fire keystrokes very fast (<100ms apart)
// then send Enter. This utility distinguishes scanner input from human typing.
//
// We read e.code (physical key) instead of e.key, because e.key reflects the active
// keyboard layout — when the OS is on a Thai layout, e.key returns Thai characters
// and the barcode gets garbled. e.code is layout-independent.

// Digit row physical keys, independent of OS keyboard layout. On Thai
// Kedmanee layout the unshifted digit row types Thai punctuation glyphs
// instead of numbers, so callers that need real digits (e.g. the POS
// search/barcode input) should use this instead of e.key.
export function digitFromCode(code: string): string | null {
  if (code.startsWith("Digit")) return code.slice(5); // Digit5 -> "5"
  if (code.startsWith("Numpad")) {
    const n = code.slice(6);
    return /^\d$/.test(n) ? n : null; // NumpadEnter etc. -> ignore
  }
  return null;
}

function codeToChar(code: string, shift: boolean): string | null {
  const digit = digitFromCode(code);
  if (digit !== null) return digit;
  if (code.startsWith("Key")) {
    const letter = code.slice(3); // KeyA -> "A"
    return shift ? letter : letter.toLowerCase();
  }
  if (code === "Minus") return "-";
  return null;
}

export function createBarcodeListener(onBarcode: (code: string) => void) {
  let buffer = "";
  let lastKeyTime = 0;

  function handleKeyDown(e: KeyboardEvent) {
    const now = Date.now();

    if (e.code === "Enter" || e.code === "NumpadEnter") {
      if (buffer.length >= 4 && now - lastKeyTime < 200) {
        // Looks like a scanner — stop this Enter from also activating
        // whatever element happens to have focus (e.g. a product/category
        // button), then fire the callback regardless of focus.
        e.preventDefault();
        onBarcode(buffer);
      }
      buffer = "";
      lastKeyTime = 0;
      return;
    }

    const char = codeToChar(e.code, e.shiftKey);
    if (char) {
      // Check if keystrokes are fast enough to be from a scanner
      if (buffer.length > 0 && now - lastKeyTime > 200) {
        buffer = ""; // Too slow — human typing, reset
      }
      buffer += char;
      lastKeyTime = now;
    }
  }

  return {
    attach: () => document.addEventListener("keydown", handleKeyDown),
    detach: () => document.removeEventListener("keydown", handleKeyDown),
  };
}

// For controlled/uncontrolled text inputs (POS search box, product barcode
// field) that need to stay layout-safe even without an Enter-suffix scanner.
//
// The tricky part: the *first* key of a scanner burst has no prior key to
// compare timing against, so we can't yet tell it apart from human typing —
// we let the browser insert its native (possibly layout-garbled) character.
// If the *next* key arrives at scanner speed (<40ms), that confirms a burst
// is happening, so we retroactively replace the previous character (which
// sits right before the cursor) with its real digit too, in addition to the
// current one. Human typing is always much slower than 40ms/key, so normal
// Thai product-name/description input is never touched.
export function useScannerSafeDigitKeyDown(
  value: string,
  setValue: (next: string) => void
) {
  const lastDigitKeyRef = useRef<{ code: string; time: number } | null>(null);

  return function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      lastDigitKeyRef.current = null;
      return;
    }

    const digit = digitFromCode(e.code);
    if (digit === null) {
      lastDigitKeyRef.current = null;
      return;
    }

    const now = Date.now();
    const prev = lastDigitKeyRef.current;
    const isScannerSpeed = prev !== null && now - prev.time < 40;
    lastDigitKeyRef.current = { code: e.code, time: now };

    if (!isScannerSpeed) {
      return;
    }

    e.preventDefault();
    const input = e.currentTarget;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    if (prev && start > 0) {
      const prevDigit = digitFromCode(prev.code)!;
      const fixed = value.slice(0, start - 1) + prevDigit + digit + value.slice(end);
      setValue(fixed);
      requestAnimationFrame(() => input.setSelectionRange(start + 1, start + 1));
      return;
    }

    setValue(value.slice(0, start) + digit + value.slice(end));
    requestAnimationFrame(() => input.setSelectionRange(start + 1, start + 1));
  };
}
