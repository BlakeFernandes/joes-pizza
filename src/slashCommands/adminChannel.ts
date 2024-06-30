import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, PermissionFlagsBits } from "discord.js";
import { prisma } from "~/index"; // Assuming you need to save this information to a database
import { SlashCommand } from "~/types";

const channelCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("channel")
        .setDescription("Manage default channel for bot messages")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("set")
                .setDescription("Set the default channel for bot messages")
                .addChannelOption((option) => option.setName("channel").setDescription("The channel to set as default").setRequired(true))
        )
        .addSubcommand((subcommand) => subcommand.setName("show").setDescription("Show the current default channel")) as SlashCommandBuilder,

    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand(false);

        if (!subcommand || subcommand === "show") {
            if (!interaction.guild) {
                await interaction.reply({ content: "Invalid guild.", ephemeral: true });
                return;
            }

            try {
                const guildSettings = await prisma.guild.findUnique({
                    where: { id: interaction.guild.id },
                    select: { defaultChannelId: true },
                });

                if (guildSettings?.defaultChannelId) {
                    const defaultChannel = await interaction.guild.channels.fetch(guildSettings.defaultChannelId);
                    if (defaultChannel) {
                        await interaction.reply({ content: `The current default channel is ${defaultChannel}.`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: "The default channel is not set or has been deleted.", ephemeral: true });
                    }
                } else {
                    await interaction.reply({ content: "The default channel is not set.", ephemeral: true });
                }
            } catch (error) {
                console.error("Error fetching default channel:", error);
                await interaction.reply({ content: "An error occurred while fetching the default channel.", ephemeral: true });
            }
        } else if (subcommand === "set") {
            const channel = interaction.options.getChannel("channel") as TextChannel;

            if (!channel || !interaction.guild) {
                await interaction.reply({ content: "Invalid channel or guild.", ephemeral: true });
                return;
            }

            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
                return;
            }

            try {
                // Assuming you want to save the default channel in your database
                await prisma.guild.upsert({
                    where: { id: interaction.guild.id },
                    update: { defaultChannelId: channel.id },
                    create: { id: interaction.guild.id, defaultChannelId: channel.id },
                });

                await interaction.reply({ content: `Default channel set to ${channel}.`, ephemeral: true });
            } catch (error) {
                console.error("Error setting default channel:", error);
                await interaction.reply({ content: "An error occurred while setting the default channel.", ephemeral: true });
            }
        }
    },
};

export default channelCommand;
