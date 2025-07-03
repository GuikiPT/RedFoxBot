import { 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  MessageFlags 
} from 'discord.js';
import { Reminder } from '../../../../db/models';
import { enhanceReminderMessage, isGoogleAIAvailable } from '../../../../utils/googleAI';
import { parseTimeString, formatTimeRemaining } from '../../../../utils/timeParser';
import { detectLanguage } from '../../../../utils/languageDetector';

export interface SubcommandHandler {
  name: string;
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const reminder: SubcommandHandler = {
  name: 'reminder',
  async handler(interaction: ChatInputCommandInteraction) {
    const description = interaction.options.getString('description', true);
    const isPublic = interaction.options.getBoolean('public') || false;
    
    // Detect the language of the original message first
    const originalLanguage = detectLanguage(description);
    
    await interaction.deferReply({ 
      flags: isPublic ? undefined : MessageFlags.Ephemeral 
    });
    
    try {
      let enhancedData = null;
      let extractedTime = null;
      let shouldNotifyInChannel = false;
      let channelMention = null;
      let enhancedTitle = null;
      let enhancedDescription = null;
      let detectedLanguage = originalLanguage; // Use detected language from original message
      
      // Try to enhance the message with Google AI
      if (isGoogleAIAvailable()) {
        try {
          enhancedData = await enhanceReminderMessage(description);
          if (enhancedData) {
            extractedTime = enhancedData.extractedTime;
            shouldNotifyInChannel = enhancedData.shouldNotifyInChannel;
            channelMention = enhancedData.channelMention;
            enhancedTitle = enhancedData.title;
            enhancedDescription = enhancedData.description;
            // Keep the original language detection instead of AI's detection
            // detectedLanguage = enhancedData.detectedLanguage || originalLanguage;
          }
        } catch (error) {
          console.warn('Failed to enhance reminder with AI:', error);
        }
      }
      
      // Parse the time - use extracted time if available, otherwise use the full description
      const timeString = extractedTime || description;
      const parsedTime = parseTimeString(timeString);
      if (!parsedTime.isValid) {
        await interaction.editReply({
          content: `❌ **Could not extract valid time:** ${parsedTime.error}\n\nPlease include time information in your description (e.g., "Buy milk in 30 minutes", "Meeting tomorrow at 2pm")`,
        });
        return;
      }
      
      // Determine notification preference
      const notifyInDM = !shouldNotifyInChannel;
      
      // Create the reminder in the database
      const reminder = await Reminder.create({
        userId: interaction.user.id,
        originalMessage: description,
        enhancedTitle,
        enhancedDescription,
        reminderTime: parsedTime.date,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        isCompleted: false,
        notifyInDM,
        channelMention,
        detectedLanguage: originalLanguage, // Store the original message language, not AI detection
      });
      
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(enhancedTitle || '✅ Reminder Created')
        .setDescription(enhancedDescription || description)
        .addFields(
          { 
            name: '📝 Original Message', 
            value: description, 
            inline: false 
          },
          { 
            name: '⏰ Reminder Time', 
            value: `<t:${Math.floor(parsedTime.date.getTime() / 1000)}:F>`, 
            inline: true 
          },
          { 
            name: '⏳ Time Remaining', 
            value: formatTimeRemaining(parsedTime.date), 
            inline: true 
          },
          {
            name: '📍 Notification',
            value: notifyInDM ? '📩 Direct Message' : `📢 ${channelMention || 'This Channel'}`,
            inline: true
          }
        )
        .setFooter({ text: `Reminder ID: ${reminder.id}` })
        .setTimestamp();
      
      if (!isGoogleAIAvailable()) {
        embed.addFields({
          name: '⚠️ Note',
          value: 'AI enhancement is not available. Check your Google AI API configuration.',
          inline: false
        });
      } else if (!enhancedData) {
        embed.addFields({
          name: '⚠️ Note',
          value: 'AI enhancement failed. Using original message.',
          inline: false
        });
      }
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error creating reminder:', error);
      await interaction.editReply({
        content: '❌ **Error:** Failed to create reminder. Please try again.',
      });
    }
  }
};
