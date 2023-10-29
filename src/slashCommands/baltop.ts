import { SlashCommandBuilder } from "discord.js";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";

const baltopCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("baltop")
        .setDescription("View the richest members"),
    execute: async (interaction) => {
      const topUsers = await joeUser.getTopBalances();
      let response = "**Top Users by Balance:**\n";

      topUsers.forEach((user, index) => {
          const roundedBalance = Math.round(user.wallet);
          response += `${index + 1}. <@${user.id}>: ${roundedBalance} coins\n`;
      });

      await interaction.reply(response);
    }
}

export default baltopCommand;