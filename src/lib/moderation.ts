/**
 * Content moderation, sanitization, and input safety utilities for GS Arena.
 */

// Zero-width characters & invisible unicode regex
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u202A-\u202E]/g;

// Normalized profanity & abusive terms blocklist (benign QA and safety test tokens)
const PROFANITY_BLOCKLIST = [
  'fuck',
  'fck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
  'bastard',
  'nigger',
  'faggot',
  'whore',
  'slut',
  'testprofanity',
  'toxicplayer',
  'hateword',
];

/**
 * Remove invisible characters, zero-width spaces, and control/null bytes.
 */
export function sanitizeInputString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(ZERO_WIDTH_REGEX, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Check if the text contains prohibited abusive language or profanity tokens.
 * Uses character normalization to catch leetspeak substitutions (e.g. 0 -> o, @ -> a, 1 -> i, $ -> s).
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;

  // Clean zero-width chars and normalize to lowercase
  const clean = sanitizeInputString(text).toLowerCase();

  // Normalize common leetspeak substitutions
  const normalized = clean
    .replace(/[@4]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[$5]/g, 's')
    .replace(/[3]/g, 'e')
    .replace(/[*_#.-]/g, '');

  // Normalized with masked asterisks/underscores mapped to standard vowels
  const vowelSubstituted = clean
    .replace(/[*_#-]/g, 'u')
    .replace(/[@4]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i');

  for (const word of PROFANITY_BLOCKLIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (
      regex.test(clean) ||
      normalized.includes(word) ||
      vowelSubstituted.includes(word)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Detect potential script injection or raw HTML tags.
 */
export function containsScriptTag(text: string): boolean {
  if (!text) return false;
  return /<\s*script\b[^>]*>|<\/\s*script\s*>/i.test(text) || /javascript\s*:/i.test(text);
}
