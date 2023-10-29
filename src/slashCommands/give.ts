import { SlashCommandBuilder, userMention } from "discord.js";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";

const baltopCommand: SlashCommand = {
    command: new SlashCommandBuilder().setName("give").setDescription("Give a user some money"),
    execute: async (interaction) => {
      const user = interaction.options.getUser("user")!;
      const amount = interaction.options.getInteger("amount")!;

      if (await joeUser.hasMoney(interaction.user.id, amount)) {
          await joeUser.withdraw(interaction.user.id, amount);
          await joeUser.deposit(user.id, amount);

          await interaction.reply(`You gave ${userMention(user.id)} ${amount} coins.`);
      } else {
          const balance = await joeUser.getBalance(interaction.user.id);
          const missingAmount = amount - balance;
          await interaction.reply(`Insufficient funds. You need ${Math.round(missingAmount)} more coins.`);
          return;
      }
    },
};

export default baltopCommand;
