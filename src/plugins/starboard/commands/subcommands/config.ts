import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  ChannelType,
} from 'discord.js';
import { SubcommandHandler } from '../../../types';
import { StarBoardConfig } from '../../../../db/models/StarBoardConfig';

export const configSubcommand: SubcommandHandler = {
  name: 'config',
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

    const channel = interaction.options.getChannel('channel', true);
    const emoji = interaction.options.getString('emoji', true);
    const threshold = interaction.options.getInteger('threshold') || 3;

    // Validate channel type
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Invalid Channel')
        .setDescription('The starboard channel must be a text or announcement channel.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    try {
      // Find or create starboard config for this guild
      let [config, created] = await StarBoardConfig.findOrCreate({
        where: { guildId: interaction.guildId },
        defaults: {
          guildId: interaction.guildId,
          channelId: channel.id,
          emoji: emoji,
          emojiThreshold: threshold,
          enabled: true,
        },
      });

      if (!created) {
        // Update existing config
        config.channelId = channel.id;
        config.emoji = emoji;
        config.emojiThreshold = threshold;
        config.enabled = true;
        await config.save();
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('⭐ Starboard Configured')
        .setDescription('The starboard has been successfully configured!')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Emoji', value: emoji, inline: true },
          { name: 'Threshold', value: threshold.toString(), inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error configuring starboard:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Configuration Failed')
        .setDescription('Failed to configure the starboard. Please try again.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
