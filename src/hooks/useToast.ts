/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

export function useToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Handle automatic timeout dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return {
    toastMessage,
    showToast,
    hideToast
  };
}
export type UseToastReturn = ReturnType<typeof useToast>;
