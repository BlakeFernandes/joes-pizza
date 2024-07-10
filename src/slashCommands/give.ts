import { PermissionFlagsBits, SlashCommandBuilder, userMention, ChatInputCommandInteraction, TextChannel } from "discord.js";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";
import { formatNumber, toBigNumber } from "~/functions/numberUtils";
import { prisma } from "..";

const giveCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("give")
        .setDescription("Give a user some money")
        .addMentionableOption((option) => option.setName("user").setDescription("The user to give money to").setRequired(true))
        .addIntegerOption((option) => option.setName("amount").setDescription("The amount of money to give").setRequired(true))
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

        const user = interaction.options.getUser("user")!;
        const amount = toBigNumber(interaction.options.getInteger("amount")!);

        if (user.id === interaction.user.id) {
            await interaction.reply("You cannot give money to yourself.");
            return;
        }

        const hasMoney = await joeUser.hasMoney(interaction.user.id, amount);
        const balance = toBigNumber(await joeUser.getBalance(interaction.user.id));

        if (hasMoney) {
            await joeUser.withdraw(interaction.user.id, amount);
            await joeUser.deposit(user.id, amount);

            await interaction.reply(`You gave ${userMention(user.id)} ${formatNumber(amount)} coins.`);
        } else {
            const missingAmount = amount.minus(balance);
            await interaction.reply(`Insufficient funds. You need ${formatNumber(missingAmount)} more coins.`);
        }
    },
};

export default giveCommand;
