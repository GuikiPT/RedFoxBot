import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../../types";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      await interaction.reply({ content: "Pinging..." });
      const sent = await interaction.fetchReply();
      const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = interaction.client.ws.ping;

      const embed = new EmbedBuilder()
        .setTitle("🏓 Pong!")
        .setThumbnail(interaction.client.user?.displayAvatarURL({ size: 1024 }))
        .addFields(
          { name: "Bot Latency", value: `\`\`\`${botLatency} ms\`\`\``, inline: true },
          { name: "API Latency", value: `\`\`\`${apiLatency} ms\`\`\``, inline: true }
        );
      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Ping command failed:', error);
    }
  }
};
