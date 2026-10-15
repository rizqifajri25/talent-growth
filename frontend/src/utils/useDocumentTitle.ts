import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title and meta description in a lightweight SPA manner.
 * Ensures consistent Aurora editorial branding across all routes without external heavy libraries.
 */
export function useDocumentTitle(title?: string, description?: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} — Talent Growth` : 'Talent Growth — Editorial Stories';

    let metaDesc = document.querySelector('meta[name="description"]');
    const previousDesc = metaDesc ? metaDesc.getAttribute('content') : null;

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = previousTitle;
      if (metaDesc && previousDesc !== null) {
        metaDesc.setAttribute('content', previousDesc);
      }
    };
  }, [title, description]);
}
