import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { SlashCommand } from "~/types";
import { prisma } from "..";

const helpCommand: SlashCommand = {
    command: new SlashCommandBuilder().setName("help").setDescription("List all available commands"),

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
        const commands = interaction.client.slashCommands;

        const embed = new EmbedBuilder().setTitle("Available Commands").setDescription("Here is a list of all available commands:").setColor(0x00ae86);

        commands.forEach((command) => {
            embed.addFields({ name: `/${command.command.name}`, value: command.command.description || "No description provided", inline: true });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

export default helpCommand;
