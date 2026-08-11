/**
 * Production-grade text processing functions.
 * All functions are pure, fast, and handle edge cases such as empty input, null/undefined, and NaNs.
 */

/**
 * Counts words, characters, sentences, paragraphs, and estimates reading time.
 * 
 * @param {string} text - The input text to analyze
 * @returns {Object} Word count stats
 */
export function countWords(text) {
  if (typeof text !== 'string') {
    text = '';
  }
  const cleanText = text || '';
  const wordsArray = cleanText.split(/\s+/).filter(w => w.length > 0);
  const words = wordsArray.length;
  const characters = cleanText.length;
  const charactersNoSpaces = cleanText.replace(/\s/g, '').length;
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  const readingTime = Math.ceil(words / 200);

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingTime
  };
}

/**
 * Counts characters and breaks them down by type (letters, digits, spaces, lines, special characters).
 * 
 * @param {string} text - The input text to analyze
 * @returns {Object} Character stats breakdown
 */
export function countCharacters(text) {
  if (typeof text !== 'string') {
    text = '';
  }
  const cleanText = text || '';
  const characters = cleanText.length;
  const charactersNoSpaces = cleanText.replace(/\s/g, '').length;
  const letters = (cleanText.match(/[a-zA-Z]/g) || []).length;
  const digits = (cleanText.match(/[0-9]/g) || []).length;
  const spaces = (cleanText.match(/ /g) || []).length;
  const lines = cleanText ? cleanText.split('\n').length : 0;
  const newlines = (cleanText.match(/\n/g) || []).length;
  const specialChars = characters - (letters + digits + spaces + newlines);

  return {
    characters,
    charactersNoSpaces,
    letters,
    digits,
    spaces,
    lines,
    specialChars
  };
}

/**
 * Converts a string to a specified case mode.
 * Supported modes: 'upper', 'lower', 'title', 'sentence', 'camel', 'pascal', 'snake', 'kebab', 'alternating'
 * 
 * @param {string} text - The input text to convert
 * @param {string} mode - The target case mode
 * @returns {string} The converted string
 */
export function convertCase(text, mode) {
  if (typeof text !== 'string') {
    return '';
  }
  const cleanMode = (mode || '').toLowerCase();
  
  switch (cleanMode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, letter) => separator + letter.toUpperCase());
    case 'camel': {
      const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);
      if (words.length === 0) return '';
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }
    case 'pascal': {
      const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }
    case 'snake': {
      const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);
      return words.join('_');
    }
    case 'kebab': {
      const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);
      return words.join('-');
    }
    case 'alternating': {
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += i % 2 === 0 ? text[i].toUpperCase() : text[i].toLowerCase();
      }
      return result;
    }
    default:
      return text;
  }
}
