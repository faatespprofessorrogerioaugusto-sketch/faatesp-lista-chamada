/**
 * Formata um nome completo para o padrão Title Case (Primeiras Letras Maiúsculas),
 * mantendo preposições e conectivos comuns em letras minúsculas (de, da, do, das, dos, e).
 */
export function formatToTitleCase(input: string): string {
  if (!input) return '';

  const lowercaseWords = new Set([
    'de',
    'da',
    'do',
    'das',
    'dos',
    'e',
    'em',
    'com',
    'del',
    'van',
    'von',
  ]);

  // Divide mantendo espaços em branco intactos durante a digitação
  const parts = input.split(/(\s+)/);

  let wordIndex = 0;
  const formattedParts = parts.map((part) => {
    if (/^\s+$/.test(part)) {
      return part;
    }

    if (!part) return '';

    // Trata palavras compostas com hífen (ex: Jean-Paul)
    if (part.includes('-')) {
      const hyphenParts = part.split('-');
      const formattedHyphens = hyphenParts.map((hPart, hIdx) => {
        const lowerH = hPart.toLowerCase();
        if (wordIndex > 0 && hIdx > 0 && lowercaseWords.has(lowerH)) {
          return lowerH;
        }
        return lowerH.charAt(0).toUpperCase() + lowerH.slice(1);
      });
      wordIndex++;
      return formattedHyphens.join('-');
    }

    const lower = part.toLowerCase();

    // Mantém conectivos e preposições em minúsculo se não for a primeira palavra
    if (wordIndex > 0 && lowercaseWords.has(lower)) {
      wordIndex++;
      return lower;
    }

    wordIndex++;
    // Primeira letra maiúscula e restante minúsculo
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return formattedParts.join('');
}

/**
 * Normaliza um texto removendo acentos e espaços extras para comparações seguras e flexíveis.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
