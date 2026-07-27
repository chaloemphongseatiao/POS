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
        // Looks like a scanner — fire callback
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
