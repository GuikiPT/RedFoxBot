// Multilingual support for the reminder system

export interface Messages {
  reminderCreated: string;
  reminderTime: string;
  timeRemaining: string;
  originalMessage: string;
  aiEnhancedMessage: string;
  reminderCompleted: string;
  reminderSnoozed: string;
  reminderRescheduled: string;
  snoozeModal: {
    title: string;
    label: string;
    placeholder: string;
  };
  rescheduleModal: {
    title: string;
    label: string;
    placeholder: string;
  };
  buttons: {
    snooze: string;
    reschedule: string;
    complete: string;
  };
  errors: {
    invalidTime: string;
    reminderNotFound: string;
    unknownOperation: string;
    generalError: string;
  };
  notifications: {
    newReminderTime: string;
    completed: string;
    snoozed: string;
    rescheduled: string;
  };
}

const translations: Record<string, Messages> = {
  en: {
    reminderCreated: '✅ Reminder Created',
    reminderTime: '⏰ Reminder Time',
    timeRemaining: '⏳ Time Remaining',
    originalMessage: '📝 Original Message',
    aiEnhancedMessage: '🤖 AI Enhanced Message',
    reminderCompleted: '✅ Reminder Completed',
    reminderSnoozed: '⏰ Reminder Snoozed',
    reminderRescheduled: '📅 Reminder Rescheduled',
    snoozeModal: {
      title: '⏰ Snooze Reminder',
      label: 'Snooze for how long?',
      placeholder: 'e.g., "in 15 minutes", "in 1 hour", "tomorrow at 9am"'
    },
    rescheduleModal: {
      title: '📅 Reschedule Reminder',
      label: 'When should I remind you?',
      placeholder: 'e.g., "in 2 hours", "tomorrow at 3pm", "next Monday at 9am"'
    },
    buttons: {
      snooze: '⏰ Snooze',
      reschedule: '📅 Reschedule',
      complete: '✅ Complete'
    },
    errors: {
      invalidTime: '❌ **Invalid time format:** {error}',
      reminderNotFound: '❌ Reminder not found or you don\'t have permission to modify it.',
      unknownOperation: '❌ Unknown operation.',
      generalError: '❌ An error occurred while processing your request.'
    },
    notifications: {
      newReminderTime: '🕐 New Reminder Time',
      completed: 'Successfully marked reminder "{title}" as completed.',
      snoozed: '(Snoozed)',
      rescheduled: '(Rescheduled)'
    }
  },
  pt: {
    reminderCreated: '✅ Lembrete Criado',
    reminderTime: '⏰ Horário do Lembrete',
    timeRemaining: '⏳ Tempo Restante',
    originalMessage: '📝 Mensagem Original',
    aiEnhancedMessage: '🤖 Mensagem Melhorada por IA',
    reminderCompleted: '✅ Lembrete Concluído',
    reminderSnoozed: '⏰ Lembrete Adiado',
    reminderRescheduled: '📅 Lembrete Reagendado',
    snoozeModal: {
      title: '⏰ Adiar Lembrete',
      label: 'Adiar por quanto tempo?',
      placeholder: 'ex: "em 15 minutos", "em 1 hora", "amanhã às 9h"'
    },
    rescheduleModal: {
      title: '📅 Reagendar Lembrete',
      label: 'Quando devo te lembrar?',
      placeholder: 'ex: "em 2 horas", "amanhã às 15h", "segunda-feira às 9h"'
    },
    buttons: {
      snooze: '⏰ Adiar',
      reschedule: '📅 Reagendar',
      complete: '✅ Concluir'
    },
    errors: {
      invalidTime: '❌ **Formato de hora inválido:** {error}',
      reminderNotFound: '❌ Lembrete não encontrado ou você não tem permissão para modificá-lo.',
      unknownOperation: '❌ Operação desconhecida.',
      generalError: '❌ Ocorreu um erro ao processar sua solicitação.'
    },
    notifications: {
      newReminderTime: '🕐 Novo Horário do Lembrete',
      completed: 'Lembrete "{title}" marcado como concluído com sucesso.',
      snoozed: '(Adiado)',
      rescheduled: '(Reagendado)'
    }
  },
  es: {
    reminderCreated: '✅ Recordatorio Creado',
    reminderTime: '⏰ Hora del Recordatorio',
    timeRemaining: '⏳ Tiempo Restante',
    originalMessage: '📝 Mensaje Original',
    aiEnhancedMessage: '🤖 Mensaje Mejorado por IA',
    reminderCompleted: '✅ Recordatorio Completado',
    reminderSnoozed: '⏰ Recordatorio Aplazado',
    reminderRescheduled: '📅 Recordatorio Reprogramado',
    snoozeModal: {
      title: '⏰ Aplazar Recordatorio',
      label: '¿Por cuánto tiempo aplazar?',
      placeholder: 'ej: "en 15 minutos", "en 1 hora", "mañana a las 9am"'
    },
    rescheduleModal: {
      title: '📅 Reprogramar Recordatorio',
      label: '¿Cuándo debo recordarte?',
      placeholder: 'ej: "en 2 horas", "mañana a las 3pm", "lunes a las 9am"'
    },
    buttons: {
      snooze: '⏰ Aplazar',
      reschedule: '📅 Reprogramar',
      complete: '✅ Completar'
    },
    errors: {
      invalidTime: '❌ **Formato de hora inválido:** {error}',
      reminderNotFound: '❌ Recordatorio no encontrado o no tienes permiso para modificarlo.',
      unknownOperation: '❌ Operación desconocida.',
      generalError: '❌ Ocurrió un error al procesar tu solicitud.'
    },
    notifications: {
      newReminderTime: '🕐 Nueva Hora del Recordatorio',
      completed: 'Recordatorio "{title}" marcado como completado exitosamente.',
      snoozed: '(Aplazado)',
      rescheduled: '(Reprogramado)'
    }
  }
};

export function getMessages(language: string): Messages {
  // Normalize language code (handle variants like pt-BR, en-US)
  const normalizedLang = language.toLowerCase().split('-')[0];
  return translations[normalizedLang] || translations['en'];
}

export function formatMessage(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}
