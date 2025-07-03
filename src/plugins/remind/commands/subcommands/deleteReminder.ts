import { 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  MessageFlags 
} from 'discord.js';
import { Reminder } from '../../../../db/models';

export interface SubcommandHandler {
  name: string;
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const deleteReminder: SubcommandHandler = {
  name: 'delete_reminder',
  async handler(interaction: ChatInputCommandInteraction) {
    const reminderId = interaction.options.getInteger('reminder_id', true);
    const isPublic = interaction.options.getBoolean('public') || false;
    
    await interaction.deferReply({ 
      flags: isPublic ? undefined : MessageFlags.Ephemeral 
    });
    
    try {
      // Find the reminder
      const reminder = await Reminder.findOne({
        where: {
          id: reminderId,
          userId: interaction.user.id, // Ensure user can only delete their own reminders
        },
      });
      
      if (!reminder) {
        await interaction.editReply({
          content: `❌ **Reminder not found:** No reminder with ID ${reminderId} found, or you don't have permission to delete it.`,
        });
        return;
      }
      
      // Delete the reminder
      await reminder.destroy();
      
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🗑️ Reminder Deleted')
        .setDescription(`Successfully deleted reminder with ID ${reminderId}`)
        .addFields({
          name: '📝 Deleted Message',
          value: reminder.enhancedDescription || reminder.originalMessage,
          inline: false
        })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error deleting reminder:', error);
      await interaction.editReply({
        content: '❌ **Error:** Failed to delete reminder. Please try again.',
      });
    }
  }
};
