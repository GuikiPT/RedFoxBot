import { Client, EmbedBuilder, TextChannel, User, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Op } from 'sequelize';
import { Reminder } from '../../../db/models';
import { EventHandler } from '../../types';
import { getMessages } from '../../../utils/i18n';

export const reminderChecker: EventHandler = {
  name: 'ready',
  once: false,
  async execute(client: Client) {
    // Set up a periodic check for reminders every minute
    setInterval(async () => {
      try {
        await checkAndSendReminders(client);
      } catch (error) {
        console.error('Error in reminder checker:', error);
      }
    }, 30000);
  }
};

async function checkAndSendReminders(client: Client) {
  const now = new Date();
  
  try {
    // Find all reminders that are due and not completed
    const dueReminders = await Reminder.findAll({
      where: {
        reminderTime: {
          [Op.lte]: now
        },
        isCompleted: false
      }
    });
    
    for (const reminder of dueReminders) {
      try {
        // Get the user
        const user = await client.users.fetch(reminder.userId);
        if (!user) {
          console.warn(`User not found for reminder ${reminder.id}`);
          await reminder.update({ isCompleted: true });
          continue;
        }
        
        // Create embed for the reminder
        const embed = new EmbedBuilder()
          .setColor(0xff6600)
          .setTitle(reminder.enhancedTitle || '🔔 Reminder!')
          .setDescription(reminder.enhancedDescription || reminder.originalMessage)
          .addFields({
            name: '📅 Originally scheduled for',
            value: `<t:${Math.floor(new Date(reminder.reminderTime).getTime() / 1000)}:F>`,
            inline: true
          })
          .setFooter({ text: `Reminder ID: ${reminder.id}` })
          .setTimestamp();
        
        if (reminder.enhancedDescription && reminder.originalMessage !== reminder.enhancedDescription) {
          embed.addFields({
            name: '📝 Original Message',
            value: reminder.originalMessage,
            inline: false
          });
        }
        
        // Create action buttons with localized labels
        const messages = getMessages(reminder.detectedLanguage || 'en');
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`remind_snooze_${reminder.id}`)
              .setLabel(messages.buttons.snooze)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`remind_reschedule_${reminder.id}`)
              .setLabel(messages.buttons.reschedule)
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`remind_complete_${reminder.id}`)
              .setLabel(messages.buttons.complete)
              .setStyle(ButtonStyle.Success)
          );
        
        // Send based on user preference
        let sent = false;
        
        if (reminder.notifyInDM) {
          // Send via DM
          try {
            await user.send({ 
              embeds: [embed],
              components: [actionRow]
            });
            sent = true;
            console.log(`✅ Sent DM reminder ${reminder.id} to user ${reminder.userId}`);
          } catch (error) {
            console.warn(`Failed to send DM reminder to user ${reminder.userId}:`, error);
            // Fallback to channel if DM fails
          }
        }
        
        // If DM failed or user wants channel notification, try channel
        if (!sent || !reminder.notifyInDM) {
          if (reminder.channelId) {
            try {
              const channel = await client.channels.fetch(reminder.channelId) as TextChannel;
              if (channel && channel.isTextBased()) {
                const content = reminder.channelMention 
                  ? `<@${reminder.userId}> ${reminder.channelMention}` 
                  : `<@${reminder.userId}>`;
                await channel.send({ 
                  content,
                  embeds: [embed],
                  components: [actionRow]
                });
                sent = true;
                console.log(`✅ Sent channel reminder ${reminder.id} to user ${reminder.userId}`);
              }
            } catch (error) {
              console.warn(`Failed to send reminder in channel ${reminder.channelId}:`, error);
              
              // If channel fails and we haven't tried DM yet, try DM as fallback
              if (!reminder.notifyInDM) {
                try {
                  await user.send({ 
                    embeds: [embed],
                    components: [actionRow]
                  });
                  sent = true;
                  console.log(`✅ Sent fallback DM reminder ${reminder.id} to user ${reminder.userId}`);
                } catch (dmError) {
                  console.warn(`Failed to send fallback DM reminder to user ${reminder.userId}:`, dmError);
                }
              }
            }
          }
        }
        
        if (sent) {
          // Mark reminder as completed
          await reminder.update({ isCompleted: true });
          console.log(`✅ Sent reminder ${reminder.id} to user ${reminder.userId}`);
        } else {
          console.error(`❌ Failed to send reminder ${reminder.id} to user ${reminder.userId}`);
          // Mark as completed anyway to avoid spam
          await reminder.update({ isCompleted: true });
        }
        
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        // Mark as completed to avoid reprocessing
        await reminder.update({ isCompleted: true });
      }
    }
    
  } catch (error) {
    console.error('Error fetching due reminders:', error);
  }
}
