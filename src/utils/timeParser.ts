import moment from 'moment';

export interface ParsedTime {
  date: Date;
  isValid: boolean;
  error?: string;
}

export function parseTimeString(timeString: string): ParsedTime {
  const now = moment();
  const input = timeString.toLowerCase().trim();
  
  // Try to parse various time formats
  let targetMoment: moment.Moment | null = null;
  
  // Relative time patterns - supporting multiple languages
  const relativePatterns = [
    // English patterns
    { pattern: /\bin (\d+) (minute|minutes|min|mins)\b/i, unit: 'minutes' },
    { pattern: /\bin (\d+) (hour|hours|hr|hrs)\b/i, unit: 'hours' },
    { pattern: /\bin (\d+) (day|days)\b/i, unit: 'days' },
    { pattern: /\bin (\d+) (week|weeks)\b/i, unit: 'weeks' },
    { pattern: /\bin (\d+) (month|months)\b/i, unit: 'months' },
    
    // Portuguese patterns
    { pattern: /\bem (\d+) (minuto|minutos|min|mins)\b/i, unit: 'minutes' },
    { pattern: /\bem (\d+) (hora|horas|hr|hrs)\b/i, unit: 'hours' },
    { pattern: /\bem (\d+) (dia|dias)\b/i, unit: 'days' },
    { pattern: /\bem (\d+) (semana|semanas)\b/i, unit: 'weeks' },
    { pattern: /\bem (\d+) (mês|meses|mes|meses)\b/i, unit: 'months' },
    
    // Spanish patterns
    { pattern: /\ben (\d+) (minuto|minutos|min|mins)\b/i, unit: 'minutes' },
    { pattern: /\ben (\d+) (hora|horas|hr|hrs)\b/i, unit: 'hours' },
    { pattern: /\ben (\d+) (día|días|dia|dias)\b/i, unit: 'days' },
    { pattern: /\ben (\d+) (semana|semanas)\b/i, unit: 'weeks' },
    { pattern: /\ben (\d+) (mes|meses)\b/i, unit: 'months' },
    
    // Abbreviated formats like "1m", "30s", "2h"
    { pattern: /\b(\d+)m\b/i, unit: 'minutes' },
    { pattern: /\b(\d+)min\b/i, unit: 'minutes' },
    { pattern: /\b(\d+)mins\b/i, unit: 'minutes' },
    { pattern: /\b(\d+)h\b/i, unit: 'hours' },
    { pattern: /\b(\d+)hr\b/i, unit: 'hours' },
    { pattern: /\b(\d+)hrs\b/i, unit: 'hours' },
    { pattern: /\b(\d+)d\b/i, unit: 'days' },
    { pattern: /\b(\d+)w\b/i, unit: 'weeks' },
    
    // "X time from now" format - English
    { pattern: /\b(\d+) (minute|minutes|min|mins) from now\b/i, unit: 'minutes' },
    { pattern: /\b(\d+) (hour|hours|hr|hrs) from now\b/i, unit: 'hours' },
    { pattern: /\b(\d+) (day|days) from now\b/i, unit: 'days' },
    { pattern: /\b(\d+) (week|weeks) from now\b/i, unit: 'weeks' },
    { pattern: /\b(\d+) (month|months) from now\b/i, unit: 'months' },
    
    // "daqui a X" format - Portuguese
    { pattern: /\bdaqui a (\d+) (minuto|minutos|min|mins)\b/i, unit: 'minutes' },
    { pattern: /\bdaqui a (\d+) (hora|horas|hr|hrs)\b/i, unit: 'hours' },
    { pattern: /\bdaqui a (\d+) (dia|dias)\b/i, unit: 'days' },
    { pattern: /\bdaqui a (\d+) (semana|semanas)\b/i, unit: 'weeks' },
    
    // Abbreviated "X from now" format
    { pattern: /\b(\d+)m from now\b/i, unit: 'minutes' },
    { pattern: /\b(\d+)min from now\b/i, unit: 'minutes' },
    { pattern: /\b(\d+)h from now\b/i, unit: 'hours' },
    { pattern: /\b(\d+)hr from now\b/i, unit: 'hours' },
    { pattern: /\b(\d+)d from now\b/i, unit: 'days' },
    { pattern: /\b(\d+)w from now\b/i, unit: 'weeks' },
  ];
  
  // Check relative patterns
  for (const { pattern, unit } of relativePatterns) {
    const match = input.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      targetMoment = now.clone().add(amount, unit as moment.unitOfTime.DurationConstructor);
      break;
    }
  }
  
  // Tomorrow patterns - multiple languages
  if (!targetMoment && (/^tomorrow/i.test(input) || /^amanhã/i.test(input) || /^mañana/i.test(input))) {
    const timeMatch = input.match(/(tomorrow|amanhã|mañana)\s+(at|às|a\s+las)\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[3]);
      const minute = timeMatch[4] ? parseInt(timeMatch[4]) : 0;
      const period = timeMatch[5]?.toLowerCase();
      
      if (period === 'pm' && hour < 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      targetMoment = now.clone().add(1, 'day').hour(hour).minute(minute).second(0);
    } else {
      targetMoment = now.clone().add(1, 'day').hour(9).minute(0).second(0); // Default to 9 AM tomorrow
    }
  }
  
  // Today patterns
  if (!targetMoment && /^(today|at)/i.test(input)) {
    const timeMatch = input.match(/(?:today\s+at\s+|at\s+)(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();
      
      if (period === 'pm' && hour < 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      targetMoment = now.clone().hour(hour).minute(minute).second(0);
      
      // If the time has already passed today, schedule for tomorrow
      if (targetMoment.isBefore(now)) {
        targetMoment.add(1, 'day');
      }
    }
  }
  
  // Specific date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
  if (!targetMoment) {
    const dateFormats = [
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
      'MM/DD/YYYY HH:mm',
      'MM/DD/YYYY',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY',
      'MMMM DD, YYYY HH:mm',
      'MMMM DD, YYYY',
      'MMM DD HH:mm',
      'MMM DD'
    ];
    
    for (const format of dateFormats) {
      const parsed = moment(input, format, true);
      if (parsed.isValid()) {
        targetMoment = parsed;
        break;
      }
    }
  }
  
  // Natural language patterns - multilingual
  if (!targetMoment) {
    if (/^next week$/i.test(input) || /^próxima semana$/i.test(input) || /^la próxima semana$/i.test(input)) {
      targetMoment = now.clone().add(1, 'week').day(1).hour(9).minute(0).second(0); // Next Monday at 9 AM
    } else if (/^next month$/i.test(input) || /^próximo mês$/i.test(input) || /^el próximo mes$/i.test(input)) {
      targetMoment = now.clone().add(1, 'month').date(1).hour(9).minute(0).second(0); // First of next month at 9 AM
    }
  }
  
  if (!targetMoment) {
    return {
      date: new Date(),
      isValid: false,
      error: 'Could not parse time format. Try formats like: "in 30 minutes", "tomorrow at 2pm", "2024-01-15 14:30"'
    };
  }
  
  // Validate that the time is in the future
  if (targetMoment.isBefore(now)) {
    return {
      date: new Date(),
      isValid: false,
      error: 'Reminder time must be in the future'
    };
  }
  
  // Validate that the time is not too far in the future (max 1 year)
  if (targetMoment.isAfter(now.clone().add(1, 'year'))) {
    return {
      date: new Date(),
      isValid: false,
      error: 'Reminder time cannot be more than 1 year in the future'
    };
  }
  
  return {
    date: targetMoment.toDate(),
    isValid: true
  };
}

export function formatTimeRemaining(targetDate: Date): string {
  const now = moment();
  const target = moment(targetDate);
  const duration = moment.duration(target.diff(now));
  
  if (duration.asMinutes() < 1) {
    return 'less than a minute';
  } else if (duration.asHours() < 1) {
    const minutes = Math.floor(duration.asMinutes());
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (duration.asDays() < 1) {
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes() % 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
  } else if (duration.asDays() < 7) {
    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours() % 24);
    return `${days} day${days !== 1 ? 's' : ''}${hours > 0 ? ` and ${hours} hour${hours !== 1 ? 's' : ''}` : ''}`;
  } else {
    return target.format('MMMM Do, YYYY [at] h:mm A');
  }
}
