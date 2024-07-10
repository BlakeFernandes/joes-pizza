import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";
import BigNumber from "bignumber.js";
import { formatNumber, toBigNumber } from "~/functions/numberUtils";
import { prisma } from "..";

const userTimeMap = new Map<string, number>();
const userBalanceMap = new Map<string, BigNumber>();

const coinFlipCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Flip a coin to win or lose coins")
        .addIntegerOption((option) => option.setName("amount").setDescription("Amount to flip").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) as SlashCommandBuilder,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const guildId = interaction.guild?.id;
        let channel = interaction.channel;

        if (guildId) {
            const guildSettings = await prisma.guild.findUnique({
                where: { id: guildId },
                select: { defaultChannelId: true },
            });

            if (guildSettings?.defaultChannelId) {
                const defaultChannel = await interaction.guild?.channels.fetch(guildSettings.defaultChannelId);
                if (defaultChannel?.isTextBased()) {
                    channel = defaultChannel as TextChannel;
                }
            }
        }

        if (!channel?.isTextBased()) {
            await interaction.reply({ content: "Couldn't find a valid text channel.", ephemeral: true });
            return;
        }
        const amountValue = interaction.options.getInteger("amount");
        if (amountValue === null) {
            await interaction.reply("You must specify a valid amount to flip.");
            return;
        }
        const amount = toBigNumber(amountValue);
        if (amount.isNaN()) {
            await interaction.reply("You must specify a valid amount to flip.");
            return;
        }
        const user = interaction.user;

        const hasMoney = await joeUser.hasMoney(user.id, amount);
        const currentBalance = toBigNumber(await joeUser.getBalance(user.id));

        if (!hasMoney) {
            const missingAmount = amount.minus(currentBalance);
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
            win = amount.multipliedBy(2);
        } else {
            win = result === "heads" ? amount : amount.negated();
        }

        userBalanceMap.set(user.id, (userBalanceMap.get(user.id) ?? toBigNumber(0)).plus(win));
        userTimeMap.set(user.id, Date.now());

        setTimeout(() => {
            userTimeMap.delete(user.id);
            userBalanceMap.delete(user.id);
        }, 1000 * 30);

        if (win.isGreaterThan(0)) {
            await joeUser.deposit(user.id, win);
        } else {
            await joeUser.withdraw(user.id, amount);
        }

        if (isJackpot) {
            await interaction.reply(`🎉 JACKPOT! 🎉 You won ${formatNumber(win)} coins!`);
        } else {
            await interaction.reply(`You flipped ${result} and ${win.isGreaterThan(0) ? "won" : "lost"} ${formatNumber(amount.abs())} coins.`);
        }
    },
};

export default coinFlipCommand;
