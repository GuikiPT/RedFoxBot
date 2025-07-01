import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  ChannelType,
  GuildTextBasedChannel,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { StarBoardConfig } from '../../../../db/models/StarBoardConfig';

export const forceSendSubcommand: SubcommandHandler = {
  name: 'force-send',
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
      // Get starboard config for this guild
      const config = await StarBoardConfig.findOne({
        where: { guildId: interaction.guildId },
      });

      if (!config || !config.enabled) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Starboard Not Configured')
          .setDescription('The starboard is not configured or is disabled for this server. Use `/starboard config` to set it up.');
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Get the starboard channel
      const starboardChannel = await interaction.guild?.channels.fetch(config.channelId);
      if (!starboardChannel || (starboardChannel.type !== ChannelType.GuildText && starboardChannel.type !== ChannelType.GuildAnnouncement)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Invalid Starboard Channel')
          .setDescription('The configured starboard channel is invalid or inaccessible.');
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

      // Create starboard embed
      const starboardEmbed = new EmbedBuilder()
        .setAuthor({
          name: originalMessage.author.displayName || originalMessage.author.username,
          iconURL: originalMessage.author.displayAvatarURL(),
        })
        .setDescription(originalMessage.content || '*No text content*')
        .setColor(0xffd700)
        .addFields({
          name: 'Source',
          value: `[Jump to message](${originalMessage.url}) in <#${originalMessage.channelId}>`,
          inline: false,
        })
        .setTimestamp(originalMessage.createdAt);

      // Add image if present
      if (originalMessage.attachments.size > 0) {
        const imageAttachment = originalMessage.attachments.find(att => 
          att.contentType?.startsWith('image/')
        );
        if (imageAttachment) {
          starboardEmbed.setImage(imageAttachment.url);
        }
      }

      // Send to starboard channel
      await (starboardChannel as GuildTextBasedChannel).send({
        content: `${config.emoji} **Force sent by ${interaction.user.displayName}**`,
        embeds: [starboardEmbed],
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('⭐ Message Sent to Starboard')
        .setDescription(`Successfully sent the message to <#${config.channelId}>.`);

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Error force sending to starboard:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Force Send Failed')
        .setDescription('Failed to send the message to starboard. Please try again.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
