const SWAHILI_MARKERS = new Set([
  'asante',
  'asubuhi',
  'akaunti',
  'anahitaji',
  'fedha',
  'habari',
  'hapana',
  'huduma',
  'hujambo',
  'jana',
  'jioni',
  'karibu',
  'kesho',
  'kuna',
  'kwako',
  'kwangu',
  'kwetu',
  'lakini',
  'mambo',
  'mchana',
  'mimi',
  'msaada',
  'naomba',
  'ndio',
  'ndiyo',
  'nina',
  'ninaomba',
  'ninaweza',
  'ninahitaji',
  'nisaidie',
  'ninyi',
  'niko',
  'nataka',
  'nzuri',
  'pole',
  'poa',
  'sahani',
  'salama',
  'sana',
  'sawa',
  'samahani',
  'shida',
  'sijui',
  'sisi',
  'tafadhali',
  'tunaweza',
  'tunahitaji',
  'tusaidie',
  'unaweza',
  'unahitaji',
  'unataka',
  'vipi',
  'vizuri',
  'wao',
  'wako',
  'wewe',
  'wapi',
  'yake',
  'yako',
  'yangu',
  'yetu',
  'yuko',
  'nime',
  'nini',
  'lini',
  'leo',
]);

const ENGLISH_INDICATORS = new Set([
  'a',
  'am',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'for',
  'from',
  'get',
  'had',
  'has',
  'have',
  'he',
  'her',
  'here',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'me',
  'my',
  'need',
  'no',
  'not',
  'of',
  'on',
  'or',
  'our',
  'please',
  'she',
  'should',
  'that',
  'the',
  'their',
  'them',
  'there',
  'they',
  'this',
  'to',
  'us',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'will',
  'with',
  'would',
  'yes',
  'you',
  'your',
]);

const SHORT_ENGLISH_MESSAGES = new Set([
  'hello',
  'hey',
  'hi',
  'okay',
  'ok',
  'please',
  'thanks',
  'thank',
  'yes',
  'no',
]);

let identifierPromise;

function getIdentifier() {
  if (!identifierPromise) {
    identifierPromise = import('cld3-asm')
      .then(({ loadModule }) => loadModule())
      .then((factory) => factory.create(0, 1000));
  }

  return identifierPromise;
}

async function detectLanguage(message) {
  const text = typeof message === 'string' ? message.trim() : '';

  if (!text) {
    return 'other';
  }

  const tokens = text.normalize('NFKC').toLowerCase().match(/\p{L}+/gu) || [];

  if (tokens.some((token) => SWAHILI_MARKERS.has(token))) {
    return 'swahili';
  }

  if (tokens.length > 0 && tokens.length <= 2
    && tokens.every((token) => SHORT_ENGLISH_MESSAGES.has(token))) {
    return 'english';
  }

  const identifier = await getIdentifier();
  const { language, probability, is_reliable: isReliable } = identifier.findLanguage(text);

  if (language === 'sw' || language === 'swa' || language === 'swh') {
    return 'swahili';
  }

  if (language === 'en' && isReliable && probability >= 0.8) {
    return 'english';
  }

  const englishIndicatorCount = tokens.filter((token) => ENGLISH_INDICATORS.has(token)).length;

  if (tokens.length <= 5 && englishIndicatorCount >= 2
    && englishIndicatorCount / tokens.length >= 0.5) {
    return 'english';
  }

  return 'other';
}

module.exports = { detectLanguage };
