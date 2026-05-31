/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safe clipboard copier that writes text using navigator.clipboard,
 * catches errors, and falls back to a document.execCommand fallback
 * if clipboard API is not supported or permitted.
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, falling back...", err);
    }
  }

  // Fallback method
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback clipboard copy failed:", err);
    return false;
  }
}
