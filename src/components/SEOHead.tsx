import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogUrl?: string;
}

const BASE_URL = 'https://brasfoot.vercel.app';
const DEFAULT_TITLE = 'BRASFOOT — Gerenciador de Futebol Brasileiro';
const DEFAULT_DESC = 'Gerencie seu time no Brasileirão 2026. Solo ou com até 8 amigos via P2P. Gratuito, sem login.';

function setMeta(property: string, content: string, attr: 'name' | 'property' = 'property') {
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SEOHead({ title, description, ogTitle, ogUrl }: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | BRASFOOT` : DEFAULT_TITLE;
    const desc = description ?? DEFAULT_DESC;

    document.title = fullTitle;
    setMeta('description', desc, 'name');
    setMeta('og:title', ogTitle ?? fullTitle);
    setMeta('og:description', desc);
    setMeta('og:url', ogUrl ? `${BASE_URL}${ogUrl}` : BASE_URL);
    setMeta('twitter:title', ogTitle ?? fullTitle);
    setMeta('twitter:description', desc);

    // Restaurar defaults ao desmontar
    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('description', DEFAULT_DESC, 'name');
      setMeta('og:title', DEFAULT_TITLE);
      setMeta('og:description', DEFAULT_DESC);
      setMeta('og:url', BASE_URL);
    };
  }, [title, description, ogTitle, ogUrl]);

  return null;
}
