import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
    
  execute: async (interaction: CommandInteraction) => {
    const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong! Bot latency: ${ping}ms`);
  }
};
