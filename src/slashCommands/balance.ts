import { PermissionFlagsBits, SlashCommandBuilder, User } from "discord.js";
import { formatNumber } from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";

const balanceCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("View your or another players balance")
        .addMentionableOption((option) => option.setName("user").setDescription("User to check balance of").setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    execute: async (interaction) => {
        const user = (interaction.options.getMentionable("user") as User) ?? interaction.user;
        const balance = await joeUser.getBalance(user.id);
        await interaction.reply(`${user} has ${formatNumber(balance)} coins`);
    },
};

export default balanceCommand;
