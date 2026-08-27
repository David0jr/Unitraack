export interface ExtractedBranding {
  suggestedName?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  palette: string[];
}

export class BrandExtractionService {
  
  static async extract(targetUrl: string): Promise<ExtractedBranding> {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Se a URL já for uma imagem direta (.png, .jpg, .svg, etc.)
    if (/\.(png|jpe?g|svg|webp|ico)(\?.*)?$/i.test(cleanUrl)) {
      return {
        logoUrl: cleanUrl,
        primaryColor: '#00B5AD',
        secondaryColor: '#1996DC',
        tertiaryColor: '#001D4A',
        palette: ['#00B5AD', '#1996DC', '#001D4A']
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    let html = '';
    try {
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: controller.signal
      });

      html = await response.text();
    } finally {
      clearTimeout(timeoutId);
    }

    // 1. Extrair Nome Sugerido
    let suggestedName = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      let rawTitle = titleMatch[1].trim();
      // Remove sufixos como "| Início", "— Nossa energia...", etc.
      rawTitle = rawTitle.split(/\||—|-|\/|•/)[0].trim();
      if (rawTitle.length > 2 && rawTitle.length < 50) {
        suggestedName = rawTitle;
      }
    }

    // 2. Extrair Logos
    const logoCandidates: string[] = [];

    // 2a. Busca por <img ... logo ...>
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const fullImgTag = match[0];
      const src = match[1];
      if (/logo|brand|marca/i.test(fullImgTag) || /logo|brand|marca/i.test(src)) {
        logoCandidates.push(src);
      }
    }

    // 2b. OpenGraph Image
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      logoCandidates.push(ogImageMatch[1]);
    }

    // 2c. Apple Touch Icon ou Favicon em alta resolução
    const appleTouchMatch = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i);
    if (appleTouchMatch && appleTouchMatch[1]) {
      logoCandidates.push(appleTouchMatch[1]);
    }

    const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
    if (iconMatch && iconMatch[1]) {
      logoCandidates.push(iconMatch[1]);
    }

    // Resolver caminhos relativos
    let finalLogoUrl: string | undefined = undefined;
    for (const cand of logoCandidates) {
      if (!cand || cand.startsWith('data:')) continue;
      try {
        const resolved = new URL(cand, cleanUrl).href;
        if (!finalLogoUrl) {
          finalLogoUrl = resolved;
        } else if (/logo/i.test(cand) && !/favicon|icon/i.test(cand)) {
          finalLogoUrl = resolved; // Prioriza imagens com 'logo' no nome
          break;
        }
      } catch (e) {}
    }

    // 3. Extrair Paleta de Cores
    const colorCounts: Record<string, number> = {};

    // 3a. Meta theme-color
    const themeColorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
    if (themeColorMatch && themeColorMatch[1]) {
      const hex = BrandExtractionService.normalizeHex(themeColorMatch[1]);
      if (hex) colorCounts[hex] = (colorCounts[hex] || 0) + 15; // Alto peso
    }

    // 3b. Hex colors no HTML / inline styles
    const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(html)) !== null) {
      const hex = BrandExtractionService.normalizeHex(hexMatch[0]);
      if (hex && !BrandExtractionService.isNeutralColor(hex)) {
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
    }

    // 3c. RGB / RGBA colors no HTML
    const rgbRegex = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi;
    let rgbMatch;
    while ((rgbMatch = rgbRegex.exec(html)) !== null) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      if (r <= 255 && g <= 255 && b <= 255) {
        const hex = BrandExtractionService.rgbToHex(r, g, b);
        if (hex && !BrandExtractionService.isNeutralColor(hex)) {
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
      }
    }

    // 4. Ordenar cores por frequência e deduplicar cores visualmente semelhantes
    const rawSortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([hex]) => hex);

    const distinctColors: string[] = [];
    for (const color of rawSortedColors) {
      const isSimilar = distinctColors.some(existing => BrandExtractionService.colorDistance(existing, color) < 40);
      if (!isSimilar) {
        distinctColors.push(color);
      }
    }

    // 5. Garantir que temos uma tríade perfeita (pelo menos 3 cores)
    let primaryColor = distinctColors[0] || '#00B5AD';
    
    // Procura uma cor escura na paleta para servir de Base/Terciária
    const darkPaletteCandidates = distinctColors.slice(1).filter(c => BrandExtractionService.getLuminance(c) < 0.28);
    const nonDarkCandidates = distinctColors.slice(1).filter(c => BrandExtractionService.getLuminance(c) >= 0.28);

    let secondaryColor = nonDarkCandidates[0] || distinctColors[1] || '';
    let tertiaryColor = darkPaletteCandidates[0] || distinctColors.find(c => c !== primaryColor && c !== secondaryColor) || '';

    // Se faltarem cores ou forem repetidas, gerar harmonizações complementares e tom escuro
    if (!secondaryColor || secondaryColor.toUpperCase() === primaryColor.toUpperCase()) {
      secondaryColor = BrandExtractionService.generateSecondaryColor(primaryColor);
    }
    if (!tertiaryColor || tertiaryColor.toUpperCase() === primaryColor.toUpperCase() || tertiaryColor.toUpperCase() === secondaryColor.toUpperCase()) {
      tertiaryColor = BrandExtractionService.generateDarkBaseColor(primaryColor);
    }

    // Garantir que a paleta contenha no mínimo as 3 selecionadas + até 6 distintas
    const fullPalette = [primaryColor, secondaryColor, tertiaryColor];
    for (const c of distinctColors) {
      if (!fullPalette.some(x => x.toUpperCase() === c.toUpperCase())) {
        fullPalette.push(c);
      }
    }

    const palette = fullPalette.slice(0, 6);

    return {
      suggestedName: suggestedName || undefined,
      logoUrl: finalLogoUrl,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      palette
    };
  }

  private static getLuminance(hex: string): number {
    const [r, g, b] = BrandExtractionService.hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  private static normalizeHex(hex: string): string | null {
    hex = hex.trim().toUpperCase();
    if (!hex.startsWith('#')) hex = `#${hex}`;
    if (/^#[0-9A-F]{6}$/.test(hex)) return hex;
    if (/^#[0-9A-F]{3}$/.test(hex)) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return null;
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => c.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private static hexToRgb(hex: string): [number, number, number] {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return [r, g, b];
  }

  private static colorDistance(hex1: string, hex2: string): number {
    const [r1, g1, b1] = BrandExtractionService.hexToRgb(hex1);
    const [r2, g2, b2] = BrandExtractionService.hexToRgb(hex2);
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  }

  private static isNeutralColor(hex: string): boolean {
    const [r, g, b] = BrandExtractionService.hexToRgb(hex);

    // Muito claro ou muito escuro (Brancos, Cinzas claros, Pretos, Cinzas escuros)
    if (r > 242 && g > 242 && b > 242) return true;
    if (r < 18 && g < 18 && b < 18) return true;

    // Diferença máxima entre canais (saturação baixa = cinza/neutro)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 18) return true;

    return false;
  }

  private static generateSecondaryColor(primaryHex: string): string {
    const [r, g, b] = BrandExtractionService.hexToRgb(primaryHex);
    // Inverter matizes levemente ou adicionar saturação de azul/esmeralda
    const secR = Math.min(255, Math.max(0, Math.round(g * 0.8 + 20)));
    const secG = Math.min(255, Math.max(0, Math.round(b * 0.9 + 50)));
    const secB = Math.min(255, Math.max(0, Math.round(r * 0.7 + 70)));
    return BrandExtractionService.rgbToHex(secR, secG, secB);
  }

  private static generateDarkBaseColor(primaryHex: string): string {
    const [r, g, b] = BrandExtractionService.hexToRgb(primaryHex);
    // Cria uma versão muito escura e elegante baseada na matiz da usina (estilo Navy / Dark Corporate)
    const darkR = Math.min(255, Math.max(5, Math.round(r * 0.12)));
    const darkG = Math.min(255, Math.max(15, Math.round(g * 0.18 + 10)));
    const darkB = Math.min(255, Math.max(40, Math.round(b * 0.25 + 30)));
    return BrandExtractionService.rgbToHex(darkR, darkG, darkB);
  }
}
