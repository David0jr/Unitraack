/**
 * Extrai o subdomínio da URL atual.
 * Suporta localhost (ex: usina1.localhost:5173) e produção (ex: usina1.sistema.com).
 */
/**
 * Extrai o slug do inquilino (tenant) da URL atual.
 * Suporta subdomínio (ex: usina1.localhost:5173/login) 
 * e caminhos (ex: localhost:5173/usina1/login).
 */
export const getSubdomain = (): string | null => {
  const host = window.location.hostname;
  const path = window.location.pathname;
  const parts = host.split('.');

  // 1. Tentar extrair do subdomínio
  let slug: string | null = null;

  if (host !== 'localhost' && host !== '127.0.0.1') {
    if (host.includes('localhost')) {
      slug = parts.length > 1 ? parts[0] : null;
    } else if (parts.length > 2) {
      const s = parts[0];
      if (s !== 'www' && s !== 'admin') {
        slug = s;
      }
    }
  }

  if (slug) return slug;

  // 2. Tentar extrair do caminho (sub-rota)
  // Ex: /usina1/login -> usina1
  const pathParts = path.split('/').filter(p => p.length > 0);
  if (pathParts.length > 0) {
    const pSlug = pathParts[0];
    // Ignorar palavras reservadas que não seriam slugs de usina
    const reserved = ['admin', 'api', 'static', 'assets', 'painel', 'undefined', 'null'];
    if (!reserved.includes(pSlug)) {
      return pSlug;
    }
  }

  return null;
};

export const isAdminPath = (): boolean => {
  const path = window.location.pathname;
  return path.startsWith('/admin');
};

