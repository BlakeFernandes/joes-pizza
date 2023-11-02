import { PermissionFlagsBits, SlashCommandBuilder, userMention } from "discord.js";
import formatNumber from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";

const BASE_COST = 500;
const MULTIPLIER = 1.05;

const levelupCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("levelup")
        .setDescription("Level up your user")
        .addSubcommand((subcommand) => subcommand.setName("max").setDescription("Level up to max level"))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    execute: async (interaction) => {
        const command = interaction.options.getSubcommand()!;
        const user = interaction.user;
        const price = Math.floor(BASE_COST * Math.pow(MULTIPLIER, await joeUser.getLevel(user.id)));

        if (command && command === "max") {
            const maxLevel = Math.floor(Math.log((await joeUser.getBalance(user.id)) / BASE_COST) / Math.log(MULTIPLIER));

            if (maxLevel <= (await joeUser.getLevel(user.id))) {
                await interaction.reply(`You need ${formatNumber(price)} more coins to level up.`);
                return;
            }

            if (!(await joeUser.hasMoney(user.id, price))) {
                await interaction.reply(`Insufficient funds. You need ${formatNumber(price)} more coins.`);
            } else {
                await joeUser.withdraw(user.id, price);
                await joeUser.addLevel(user.id, maxLevel - (await joeUser.getLevel(user.id)));

                await interaction.reply(`You leveled up to \`\`🍕${await joeUser.getLevel(user.id)}\`\` for ${formatNumber(price)} coins.`);
            }

            return;
        }

        if (!(await joeUser.hasMoney(user.id, price))) {
            await interaction.reply(`Insufficient funds. You need ${formatNumber(price)} more coins.`);
        } else {
            await joeUser.withdraw(user.id, price);
            await joeUser.addLevel(user.id, 1);

            await interaction.reply(`You leveled up to \`\`🍕${await joeUser.getLevel(user.id)}\`\` for ${formatNumber(price)} coins.`);
        }
    },
};

export default levelupCommand;
