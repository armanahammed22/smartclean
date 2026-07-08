
'use client';

import React, { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

/**
 * LiveChatLoader Component
 * - Fetches chat configuration from Firestore.
 * - Injects the embed script asynchronously on all public pages.
 * - Prevents script execution in the admin dashboard.
 */
export function LiveChatLoader() {
  const db = useFirestore();
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith('/admin');
  const isStaffPath = pathname.startsWith('/staff');

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'live_chat') : null, [db]);
  const { data: config } = useDoc(configRef);

  useEffect(() => {
    // 🛡️ Security & Performance Guard:
    // 1. Don't load if tracking is disabled.
    // 2. Don't load on administrative/staff paths.
    // 3. Don't load if no script is provided.
    if (!config || !config.isEnabled || !config.embedScript || isAdminPath || isStaffPath) {
      // Cleanup if any existing script was injected
      const existing = document.getElementById('sc-live-chat-script');
      if (existing) existing.remove();
      return;
    }

    try {
      // 1. Create a script container to manage life-cycle
      let scriptContainer = document.getElementById('sc-live-chat-script');
      if (scriptContainer) {
        scriptContainer.remove();
      }
      
      scriptContainer = document.createElement('div');
      scriptContainer.id = 'sc-live-chat-script';
      scriptContainer.style.display = 'none';
      
      // 2. Extract script source and content
      // We manually execute the scripts found in the embed code
      const parser = new DOMParser();
      const doc = parser.parseFromString(config.embedScript, 'text/html');
      const scripts = Array.from(doc.querySelectorAll('script'));

      scripts.forEach(s => {
        const scriptElement = document.createElement('script');
        scriptElement.async = true;
        
        // Copy all attributes (src, type, etc.)
        Array.from(s.attributes).forEach(attr => {
          scriptElement.setAttribute(attr.name, attr.value);
        });

        // Copy inline content
        if (s.innerHTML) {
          scriptElement.innerHTML = s.innerHTML;
        }

        scriptContainer?.appendChild(scriptElement);
      });

      // 3. Inject Custom CSS if provided
      if (config.customCss) {
        const style = document.createElement('style');
        style.innerHTML = config.customCss;
        scriptContainer.appendChild(style);
      }

      // 4. Inject Custom JS if provided
      if (config.customJs) {
        const customJs = document.createElement('script');
        customJs.innerHTML = config.customJs;
        scriptContainer.appendChild(customJs);
      }

      document.body.appendChild(scriptContainer);

    } catch (error) {
      console.error('[LiveChatLoader] Critical Failure:', error);
    }

    return () => {
      const existing = document.getElementById('sc-live-chat-script');
      if (existing) existing.remove();
    };
  }, [config, isAdminPath, isStaffPath]);

  return null;
}
