/**
 * Simple language detection utility for reminder messages
 */

// Common words in different languages to help detect the language
const languagePatterns = {
  en: [
    'remind', 'me', 'to', 'in', 'at', 'tomorrow', 'today', 'hour', 'minute', 'minutes', 'hours', 
    'week', 'month', 'day', 'time', 'next', 'this', 'channel', 'here', 'notify', 'notification',
    'morning', 'afternoon', 'evening', 'night', 'am', 'pm', 'the', 'and', 'of', 'for', 'with'
  ],
  pt: [
    'lembrar', 'me', 'de', 'em', 'às', 'amanhã', 'hoje', 'hora', 'minuto', 'minutos', 'horas',
    'semana', 'mês', 'dia', 'tempo', 'próximo', 'próxima', 'este', 'esta', 'canal', 'aqui', 'notificar', 'notificação',
    'manhã', 'tarde', 'noite', 'madrugada', 'daqui', 'para', 'com', 'que', 'uma', 'um', 'na', 'no', 'da', 'do'
  ],
  es: [
    'recordar', 'me', 'de', 'en', 'a', 'mañana', 'hoy', 'hora', 'minuto', 'minutos', 'horas',
    'semana', 'mes', 'día', 'tiempo', 'próximo', 'próxima', 'este', 'esta', 'canal', 'aquí', 'notificar', 'notificación',
    'mañana', 'tarde', 'noche', 'madrugada', 'para', 'con', 'que', 'una', 'un', 'la', 'el', 'las', 'los'
  ]
};

/**
 * Detect the language of a text message
 * @param text The text to analyze
 * @returns Language code (en, pt, es) with 'en' as fallback
 */
export function detectLanguage(text: string): string {
  const lowercaseText = text.toLowerCase();
  const words = lowercaseText.split(/\s+/);
  
  const scores = {
    en: 0,
    pt: 0,
    es: 0
  };
  
  // Count matches for each language
  for (const word of words) {
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.includes(word)) {
        scores[lang as keyof typeof scores]++;
      }
    }
  }
  
  // Additional specific patterns
  // Portuguese specific patterns
  if (/\b(daqui\s+a|em\s+\d+|às\s+\d+|próxim[ao]|lembrança)\b/i.test(lowercaseText)) {
    scores.pt += 2;
  }
  
  // Spanish specific patterns  
  if (/\b(en\s+\d+|a\s+las\s+\d+|próxim[ao]|recordatorio)\b/i.test(lowercaseText)) {
    scores.es += 2;
  }
  
  // English specific patterns
  if (/\b(in\s+\d+|at\s+\d+|next\s+|reminder)\b/i.test(lowercaseText)) {
    scores.en += 2;
  }
  
  // Find language with highest score
  const detectedLang = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
  )[0];
  
  // If no clear winner or very low scores, default to English
  if (scores[detectedLang as keyof typeof scores] < 1) {
    return 'en';
  }
  
  return detectedLang;
}
