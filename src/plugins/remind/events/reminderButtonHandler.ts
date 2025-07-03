import { 
  ButtonInteraction, 
  Client, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  EmbedBuilder,
  MessageFlags
} from 'discord.js';
import { Reminder } from '../../../db/models';
import { EventHandler } from '../../types';
import { getMessages, formatMessage } from '../../../utils/i18n';

export const reminderButtonHandler: EventHandler = {
  name: 'interactionCreate',
  async execute(client: Client, interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;
    
    // Check if this is a reminder button
    if (!interaction.customId.startsWith('remind_')) return;
    
    const [action, operation, reminderIdStr] = interaction.customId.split('_');
    const reminderId = parseInt(reminderIdStr);
    
    if (isNaN(reminderId)) {
      await interaction.reply({
        content: '❌ Invalid reminder ID.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    try {
      // Find the reminder
      const reminder = await Reminder.findOne({
        where: {
          id: reminderId,
          userId: interaction.user.id, // Ensure user can only interact with their own reminders
        },
      });
      
      if (!reminder) {
        await interaction.reply({
          content: '❌ Reminder not found or you don\'t have permission to modify it.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }
      
      switch (operation) {
        case 'complete':
          await handleCompleteReminder(interaction, reminder);
          break;
        case 'snooze':
          await handleSnoozeReminder(interaction, reminder);
          break;
        case 'reschedule':
          await handleRescheduleReminder(interaction, reminder);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown operation.',
            flags: MessageFlags.Ephemeral
          });
      }
    } catch (error) {
      console.error('Error handling reminder button interaction:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

async function handleCompleteReminder(interaction: ButtonInteraction, reminder: Reminder) {
  const messages = getMessages(reminder.detectedLanguage || 'en');
  
  await reminder.update({ isCompleted: true });
  
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(messages.reminderCompleted)
    .setDescription(formatMessage(messages.notifications.completed, { 
      title: reminder.enhancedTitle || reminder.originalMessage 
    }))
    .setTimestamp();
  
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral
  });
  
  // Update the original message to show it's completed
  try {
    const originalEmbed = interaction.message.embeds[0];
    if (originalEmbed) {
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0x808080)
        .setTitle('✅ ' + originalEmbed.title?.replace(/🔔|✅/, '').trim());
      
      await interaction.message.edit({
        embeds: [updatedEmbed],
        components: [] // Remove buttons
      });
    }
  } catch (error) {
    console.warn('Failed to update original reminder message:', error);
  }
}

async function handleSnoozeReminder(interaction: ButtonInteraction, reminder: Reminder) {
  const messages = getMessages(reminder.detectedLanguage || 'en');
  
  const modal = new ModalBuilder()
    .setCustomId(`remind_snooze_modal_${reminder.id}`)
    .setTitle(messages.snoozeModal.title);
  
  const timeInput = new TextInputBuilder()
    .setCustomId('snooze_time')
    .setLabel(messages.snoozeModal.label)
    .setPlaceholder(messages.snoozeModal.placeholder)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);
  
  const timeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);
  modal.addComponents(timeRow);
  
  await interaction.showModal(modal);
}

async function handleRescheduleReminder(interaction: ButtonInteraction, reminder: Reminder) {
  const messages = getMessages(reminder.detectedLanguage || 'en');
  
  const modal = new ModalBuilder()
    .setCustomId(`remind_reschedule_modal_${reminder.id}`)
    .setTitle(messages.rescheduleModal.title);
  
  const timeInput = new TextInputBuilder()
    .setCustomId('new_time')
    .setLabel(messages.rescheduleModal.label)
    .setPlaceholder(messages.rescheduleModal.placeholder)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);
  
  const timeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);
  modal.addComponents(timeRow);
  
  await interaction.showModal(modal);
}
