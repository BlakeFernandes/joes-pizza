import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { formatNumber } from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { Command, SlashCommand } from "~/types";

const userTimeMap = new Map<string, number>();
const userBalanceMap = new Map<string, number>();

const coinFlipCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Flip a coin to win or lose coins")
        .addIntegerOption((option) => option.setName("amount").setDescription("amount to flip"))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    execute: async (interaction) => {
        const amount = interaction.options.getInteger("amount");
        const user = interaction.user;

        const hasMoney = await joeUser.hasMoney(user.id, amount);
        const currentBalance = await joeUser.getBalance(user.id);

        if (!hasMoney) {
            const missingAmount = amount - currentBalance;
            await interaction.reply(`Insufficient funds. You need ${formatNumber(missingAmount)} more coins.`);
            return;
        }

        let result = Math.random() < 0.51 ? "heads" : "tails";

        if (user.id === "1167645797366648882") {
            result = Math.random() > 0.49 ? "heads" : "tails";
        }

        const isJackpot = Math.random() < 1 / 6000;

        let win;
        if (isJackpot) {
            win = 2 * amount;
        } else {
            win = result === "heads" ? amount : -amount;
        }

        userBalanceMap.set(user.id, (userBalanceMap.get(user.id) ?? 0) + win);
        userTimeMap.set(user.id, Date.now());

        setInterval(() => {
            if (userTimeMap.get(user.id) && Date.now() - userTimeMap.get(user.id)! > 1000 * 30) {
                userTimeMap.delete(user.id);
                userBalanceMap.delete(user.id);
            }
        }, 1000 * 30);

        if (win > 0) {
            joeUser.deposit(user.id, amount);
        } else {
            joeUser.withdraw(user.id, amount);
        }

        if (isJackpot) {
            await interaction.reply(`🎉 JACKPOT! 🎉 You won ${formatNumber(win)} coins!`);
        } else if (userBalanceMap.has(user.id)) {
            await interaction.reply(`You flipped ${result} and ${win > 0 ? "won" : "lost"} ${formatNumber(amount)} coins.`);
        } else {
            await interaction.reply(`You flipped ${result} and ${win > 0 ? "won" : "lost"} ${formatNumber(amount)} coins.`);
        }
    },
};

export default coinFlipCommand;
