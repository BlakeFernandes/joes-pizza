import { PermissionFlagsBits, SlashCommandBuilder, userMention } from "discord.js";
import formatNumber from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";

const giveCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("give")
        .setDescription("Give a user some money")
        .addMentionableOption((option) => option.setName("user").setDescription("The user to give money to").setRequired(true))
        .addIntegerOption((option) => option.setName("amount").setDescription("The amount of money to give").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    execute: async (interaction) => {
        const user = interaction.options.getUser("user")!;
        const amount = interaction.options.getInteger("amount")!;

        if (await joeUser.hasMoney(interaction.user.id, amount)) {
            await joeUser.withdraw(interaction.user.id, amount);
            await joeUser.deposit(user.id, amount);

            await interaction.reply(`You gave ${userMention(user.id)} ${formatNumber(amount)} coins.`);
        } else {
            const balance = await joeUser.getBalance(interaction.user.id);
            const missingAmount = amount - balance;
            await interaction.reply(`Insufficient funds. You need ${formatNumber(missingAmount)} more coins.`);
            return;
        }
    },
};

export default giveCommand;
