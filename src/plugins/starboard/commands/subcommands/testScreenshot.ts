import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  ChannelType,
  GuildTextBasedChannel,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { generateStarboardScreenshot } from '../../utils/starboardHelpers';
import { config } from '../../../../config/config';

export const testScreenshotSubcommand: SubcommandHandler = {
  name: 'test-screenshot',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guildId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Error')
        .setDescription('This command can only be used in a server.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const messageInput = interaction.options.getString('message', true);
    
    try {
      // Check if screenshots are enabled
      if (!config.STARBOARD_SCREENSHOTS_ENABLED) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle('⚠️ Screenshots Disabled')
          .setDescription(
            'Screenshot generation is currently disabled. ' +
            'Set `STARBOARD_SCREENSHOTS_ENABLED=true` in your environment variables to enable it.'
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Try to parse the message input (could be message URL or ID)
      let messageId: string;
      let channelId: string;
      
      if (messageInput.includes('discord.com/channels/')) {
        // Message URL format: https://discord.com/channels/guildId/channelId/messageId
        const urlParts = messageInput.split('/');
        if (urlParts.length >= 3) {
          channelId = urlParts[urlParts.length - 2];
          messageId = urlParts[urlParts.length - 1];
        } else {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Invalid Message URL')
            .setDescription('Please provide a valid Discord message URL or message ID.');
          await interaction.editReply({ embeds: [embed] });
          return;
        }
      } else {
        // Assume it's a message ID in the current channel
        messageId = messageInput;
        channelId = interaction.channelId;
      }

      // Fetch the original message
      const sourceChannel = await interaction.guild?.channels.fetch(channelId);
      if (!sourceChannel || !sourceChannel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Invalid Source Channel')
          .setDescription('The source channel is invalid or inaccessible.');
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const originalMessage = await (sourceChannel as GuildTextBasedChannel).messages.fetch(messageId);
      if (!originalMessage) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Message Not Found')
          .setDescription('Could not find the specified message.');
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Generate screenshot
      const startTime = Date.now();
      const screenshotAttachment = await generateStarboardScreenshot(originalMessage);
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (screenshotAttachment) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Screenshot Test Successful')
          .setDescription(
            `Successfully generated a screenshot for the message!\n\n` +
            `**Generation Time:** ${duration}ms\n` +
            `**File Size:** ${screenshotAttachment.attachment.toString().length} bytes\n` +
            `**Screenshot API:** ${config.STARBOARD_API_ENDPOINT || 'Local Playwright rendering'}`
          )
          .addFields(
            { name: '📝 Original Message', value: `[View Message](${originalMessage.url})`, inline: true },
            { name: '👤 Author', value: originalMessage.author.displayName || originalMessage.author.username, inline: true },
            { name: '📅 Created', value: `<t:${Math.floor(originalMessage.createdTimestamp / 1000)}:R>`, inline: true }
          )
          .setFooter({ 
            text: `Tested by ${interaction.user.displayName}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed],
          files: [screenshotAttachment]
        });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Screenshot Test Failed')
          .setDescription(
            `Failed to generate a screenshot for the message.\n\n` +
            `**Generation Time:** ${duration}ms\n` +
            `**Screenshot API:** ${config.STARBOARD_API_ENDPOINT || 'Local Playwright rendering'}\n\n` +
            `Check the bot logs for more details about the error.`
          )
          .addFields(
            { name: '📝 Original Message', value: `[View Message](${originalMessage.url})`, inline: true },
            { name: '👤 Author', value: originalMessage.author.displayName || originalMessage.author.username, inline: true }
          )
          .setFooter({ 
            text: `Tested by ${interaction.user.displayName}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error testing screenshot generation:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Screenshot Test Error')
        .setDescription('An error occurred while testing screenshot generation. Check the bot logs for details.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
