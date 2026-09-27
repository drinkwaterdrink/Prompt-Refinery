/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { recursiveSanitize, redactString } from './sanitize';

export function safeExportFileName(fileName: string): string {
  return redactString(fileName).replace(/[\\/:*?"<>|]/g, '_');
}

/**
 * Sanitizes and exports any JSON payload as a file download.
 */
export function downloadJSON(data: any, fileName: string): void {
  const sanitized = recursiveSanitize(data);
  const jsonStr = JSON.stringify(sanitized, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeExportFileName(fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitizes and exports Markdown/text content as a file download.
 */
export function downloadMarkdown(content: string, fileName: string): void {
  const sanitized = recursiveSanitize(content);
  const blob = new Blob([sanitized], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeExportFileName(fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
