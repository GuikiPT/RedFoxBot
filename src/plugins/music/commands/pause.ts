import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { sessions } from "./play";

export const pause: Command = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause playback"),
  async execute(interaction: ChatInputCommandInteraction) {
    const session = sessions.get(interaction.guild!.id);
    if (!session) {
      await interaction.reply({ content: "Nothing is playing", ephemeral: true });
      return;
    }
    await session.player.setPaused(true);
    await interaction.reply({ content: "Paused", ephemeral: true });
  }
};
