import { 
  ModalSubmitInteraction, 
  Client, 
  EmbedBuilder,
  MessageFlags
} from 'discord.js';
import { Reminder } from '../../../db/models';
import { parseTimeString, formatTimeRemaining } from '../../../utils/timeParser';
import { EventHandler } from '../../types';
import { getMessages, formatMessage } from '../../../utils/i18n';

export const reminderModalHandler: EventHandler = {
  name: 'interactionCreate',
  async execute(client: Client, interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return;
    
    // Check if this is a reminder modal
    if (!interaction.customId.startsWith('remind_')) return;
    
    const parts = interaction.customId.split('_');
    if (parts.length < 4) return;
    
    const [, operation, , reminderIdStr] = parts;
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
          userId: interaction.user.id,
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
        case 'snooze':
          await handleSnoozeModal(interaction, reminder);
          break;
        case 'reschedule':
          await handleRescheduleModal(interaction, reminder);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown operation.',
            flags: MessageFlags.Ephemeral
          });
      }
    } catch (error) {
      console.error('Error handling reminder modal submission:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

async function handleSnoozeModal(interaction: ModalSubmitInteraction, reminder: Reminder) {
  const messages = getMessages(reminder.detectedLanguage || 'en');
  const snoozeTimeString = interaction.fields.getTextInputValue('snooze_time');
  
  // Parse the snooze time
  const parsedTime = parseTimeString(snoozeTimeString);
  if (!parsedTime.isValid) {
    await interaction.reply({
      content: `❌ **Invalid time format:** ${parsedTime.error}`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }
  
  // Create a new reminder with the same content but new time
  const newReminder = await Reminder.create({
    userId: reminder.userId,
    originalMessage: reminder.originalMessage,
    enhancedTitle: reminder.enhancedTitle,
    enhancedDescription: reminder.enhancedDescription,
    reminderTime: parsedTime.date,
    channelId: reminder.channelId,
    guildId: reminder.guildId,
    isCompleted: false,
    notifyInDM: reminder.notifyInDM,
    channelMention: reminder.channelMention,
    detectedLanguage: reminder.detectedLanguage,
  });
  
  // Mark the original reminder as completed
  await reminder.update({ isCompleted: true });
  
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(messages.reminderSnoozed)
    .setDescription(reminder.enhancedDescription || reminder.originalMessage)
    .addFields(
      {
        name: messages.notifications.newReminderTime,
        value: `<t:${Math.floor(parsedTime.date.getTime() / 1000)}:F>`,
        inline: true
      },
      {
        name: messages.timeRemaining,
        value: formatTimeRemaining(parsedTime.date),
        inline: true
      }
    )
    .setFooter({ text: `New Reminder ID: ${newReminder.id}` })
    .setTimestamp();
  
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral
  });
  
  // Update the original message to show it's snoozed
  try {
    const originalEmbed = interaction.message?.embeds[0];
    if (originalEmbed) {
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0x808080)
        .setTitle('⏰ ' + originalEmbed.title?.replace(/🔔|⏰/, '').trim() + ' (Snoozed)');
      
      await interaction.message?.edit({
        embeds: [updatedEmbed],
        components: [] // Remove buttons
      });
    }
  } catch (error) {
    console.warn('Failed to update original reminder message:', error);
  }
}

async function handleRescheduleModal(interaction: ModalSubmitInteraction, reminder: Reminder) {
  const messages = getMessages(reminder.detectedLanguage || 'en');
  const newTimeString = interaction.fields.getTextInputValue('new_time');
  
  // Parse the new time
  const parsedTime = parseTimeString(newTimeString);
  if (!parsedTime.isValid) {
    await interaction.reply({
      content: `❌ **Invalid time format:** ${parsedTime.error}`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }
  
  // Update the existing reminder with the new time
  await reminder.update({
    reminderTime: parsedTime.date,
    isCompleted: false // Make sure it's not marked as completed
  });
  
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(messages.reminderRescheduled)
    .setDescription(reminder.enhancedDescription || reminder.originalMessage)
    .addFields(
      {
        name: messages.notifications.newReminderTime,
        value: `<t:${Math.floor(parsedTime.date.getTime() / 1000)}:F>`,
        inline: true
      },
      {
        name: messages.timeRemaining,
        value: formatTimeRemaining(parsedTime.date),
        inline: true
      }
    )
    .setFooter({ text: `Reminder ID: ${reminder.id}` })
    .setTimestamp();
  
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral
  });
  
  // Update the original message to show it's rescheduled
  try {
    const originalEmbed = interaction.message?.embeds[0];
    if (originalEmbed) {
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0x808080)
        .setTitle('📅 ' + originalEmbed.title?.replace(/🔔|📅/, '').trim() + ' (Rescheduled)');
      
      await interaction.message?.edit({
        embeds: [updatedEmbed],
        components: [] // Remove buttons
      });
    }
  } catch (error) {
    console.warn('Failed to update original reminder message:', error);
  }
}
