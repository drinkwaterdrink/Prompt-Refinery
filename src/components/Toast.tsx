/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#121212] border border-primary/30 text-primary px-4 py-3 rounded-lg shadow-2xl animate-bounce backdrop-blur"
      id="toast-alert"
    >
      <Zap className="h-4 w-4 text-primary fill-[#00e5ff]" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
