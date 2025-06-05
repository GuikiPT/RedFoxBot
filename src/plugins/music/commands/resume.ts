import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { sessions } from "./play";

export const resume: Command = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume playback"),
  async execute(interaction: ChatInputCommandInteraction) {
    const session = sessions.get(interaction.guild!.id);
    if (!session) {
      await interaction.reply({ content: "Nothing is playing", ephemeral: true });
      return;
    }
    await session.player.setPaused(false);
    await interaction.reply({ content: "Resumed", ephemeral: true });
  }
};
