'use client';

import React, { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

/**
 * LiveChatLoader Component
 * - Fetches chat configuration from Firestore.
 * - Injects the embed script reliably on all public pages.
 * - Prevents script execution in the admin/staff dashboard.
 * - Fixed: Prevent destructive cleanup of global objects that causes 'onBeforeLoaded' TypeErrors.
 */
export function LiveChatLoader() {
  const db = useFirestore();
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith('/admin');
  const isStaffPath = pathname.startsWith('/staff');
  const lastScriptRef = useRef<string>('');

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'live_chat') : null, [db]);
  const { data: config } = useDoc(configRef);

  useEffect(() => {
    // 🛡️ Security & Performance Guard:
    // Only load on public pages and if enabled
    const shouldLoad = config?.isEnabled && config?.embedScript && !isAdminPath && !isStaffPath;

    if (!shouldLoad) {
      cleanup();
      return;
    }

    // 🛡️ Prevention: Don't re-inject if the script content hasn't changed
    if (lastScriptRef.current === config.embedScript) return;
    
    // Clear previous if script content changed
    cleanup();
    lastScriptRef.current = config.embedScript;

    try {
      // 1. Create a script container
      const scriptContainer = document.createElement('div');
      scriptContainer.id = 'sc-live-chat-container';
      scriptContainer.style.display = 'none';
      document.body.appendChild(scriptContainer);
      
      // 2. Use Range to execute scripts within the string reliably
      const range = document.createRange();
      range.selectNode(scriptContainer);
      const fragment = range.createContextualFragment(config.embedScript);
      scriptContainer.appendChild(fragment);

      // 3. Inject Custom CSS if provided
      if (config.customCss) {
        const style = document.createElement('style');
        style.id = 'sc-live-chat-custom-css';
        style.innerHTML = config.customCss;
        document.head.appendChild(style);
      }

      // 4. Inject Custom JS if provided
      if (config.customJs) {
        const customJs = document.createElement('script');
        customJs.id = 'sc-live-chat-custom-js';
        customJs.innerHTML = customJs.innerHTML;
        document.body.appendChild(customJs);
      }

    } catch (error) {
      console.warn('[LiveChatLoader] Script execution suppressed or failed:', error);
    }

    /**
     * Safe Cleanup Function
     * Removes DOM elements but avoids destroying global objects that cause runtime crashes.
     */
    function cleanup() {
      const container = document.getElementById('sc-live-chat-container');
      if (container) container.remove();
      
      const css = document.getElementById('sc-live-chat-custom-css');
      if (css) css.remove();
      
      const js = document.getElementById('sc-live-chat-custom-js');
      if (js) js.remove();

      // 🧹 Safe Global Object Management
      if (typeof window !== 'undefined') {
        const win = window as any;
        if (win.Tawk_API && typeof win.Tawk_API.hideWidget === 'function') {
          try {
            win.Tawk_API.hideWidget();
          } catch (e) {}
        }
        // NOTE: We no longer set Tawk_API to undefined here because it leads to 
        // "Cannot read properties of undefined (reading 'onBeforeLoaded')" in the underlying script.
      }
      
      lastScriptRef.current = '';
    }

    return cleanup;
  }, [config, isAdminPath, isStaffPath]);

  return null;
}
