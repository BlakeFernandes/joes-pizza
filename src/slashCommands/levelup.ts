import { PermissionFlagsBits, SlashCommandBuilder, userMention } from "discord.js";
import formatNumber from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";

const BASE_COST = 2000;
const MULTIPLIER = 1.15;

const levelupCommand: SlashCommand = {
    command: new SlashCommandBuilder().setName("levelup").setDescription("Level up your user").setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    execute: async (interaction) => {
        const user = interaction.user;
        const price = Math.floor(BASE_COST * Math.pow(MULTIPLIER, await joeUser.getLevel(user.id)));

        if (!(await joeUser.hasMoney(user.id, price))) {
            command: new SlashCommandBuilder();
            await interaction.reply(`Insufficient funds. You need ${formatNumber(price)} more coins.`);
        } else {
            await joeUser.withdraw(user.id, price);
            await joeUser.addLevel(user.id, 1);

            await interaction.reply(`You leveled up to \`\`🍕${await joeUser.getLevel(user.id)}\`\` for ${formatNumber(price)} coins.`);
        }
    },
};

export default levelupCommand;
