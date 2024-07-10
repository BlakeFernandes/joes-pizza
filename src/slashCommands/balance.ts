import { PermissionFlagsBits, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from "discord.js";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";
import { formatNumber, toBigNumber } from "~/functions/numberUtils";
import { prisma } from "..";

const balanceCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("View your or another player's balance")
        .addUserOption((option) => option.setName("user").setDescription("User to check balance of").setRequired(false))
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
        const user = interaction.options.getUser("user") ?? interaction.user;
        try {
            const balance = await joeUser.getBalance(user.id);
            const balanceBigNumber = toBigNumber(balance);
            await interaction.reply(`${user.username} has ${formatNumber(balanceBigNumber)} coins`);
        } catch (error) {
            if (error instanceof Error) {
                await interaction.reply(`Error: ${error.message}`);
            } else {
                await interaction.reply("Unknown error occurred.");
            }
        }
    },
};

export default balanceCommand;
