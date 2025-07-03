import { 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  MessageFlags 
} from 'discord.js';
import { Op } from 'sequelize';
import { Reminder } from '../../../../db/models';
import { formatTimeRemaining } from '../../../../utils/timeParser';

export interface SubcommandHandler {
  name: string;
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const listReminders: SubcommandHandler = {
  name: 'list_reminders',
  async handler(interaction: ChatInputCommandInteraction) {
    const showAll = interaction.options.getBoolean('show_completed') || false;
    const isPublic = interaction.options.getBoolean('public') || false;
    
    await interaction.deferReply({ 
      flags: isPublic ? undefined : MessageFlags.Ephemeral 
    });
    
    try {
      const whereClause: any = {
        userId: interaction.user.id,
      };
      
      if (!showAll) {
        whereClause.isCompleted = false;
      }
      
      const reminders = await Reminder.findAll({
        where: whereClause,
        order: [['reminderTime', 'ASC']],
        limit: 20, // Limit to prevent too long messages
      });
      
      if (reminders.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xffaa00)
          .setTitle('📋 Your Reminders')
          .setDescription(showAll ? 'You have no reminders.' : 'You have no active reminders.')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📋 Your Reminders')
        .setDescription(`Found ${reminders.length} reminder${reminders.length !== 1 ? 's' : ''}`)
        .setTimestamp();
      
      const now = new Date();
      
      for (const reminder of reminders) {
        const isPast = new Date(reminder.reminderTime) < now;
        const timeDisplay = isPast 
          ? `⏰ <t:${Math.floor(new Date(reminder.reminderTime).getTime() / 1000)}:R> (Overdue)`
          : `⏰ <t:${Math.floor(new Date(reminder.reminderTime).getTime() / 1000)}:R>`;
        
        let status = '';
        if (reminder.isCompleted) {
          status = '✅ Completed';
        } else if (isPast) {
          status = '🔴 Overdue';
        } else {
          status = '🟢 Active';
        }
        
        const title = reminder.enhancedTitle || 'Reminder';
        const messageToShow = reminder.enhancedDescription || reminder.originalMessage;
        const truncatedMessage = messageToShow.length > 100 
          ? messageToShow.substring(0, 100) + '...' 
          : messageToShow;
        
        const notificationInfo = reminder.notifyInDM ? '📩 DM' : `📢 ${reminder.channelMention || 'Channel'}`;
        
        embed.addFields({
          name: `${status} - ${title} (ID: ${reminder.id})`,
          value: `📝 ${truncatedMessage}\n${timeDisplay}\n📍 ${notificationInfo}`,
          inline: false
        });
      }
      
      if (reminders.length === 20) {
        embed.setFooter({ text: 'Showing first 20 reminders only' });
      }
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error fetching reminders:', error);
      await interaction.editReply({
        content: '❌ **Error:** Failed to fetch reminders. Please try again.',
      });
    }
  }
};
