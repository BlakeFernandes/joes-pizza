import { PermissionFlagsBits, SlashCommandBuilder, userMention } from "discord.js";
import formatNumber from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { Command, SlashCommand } from "~/types";

const BASE_COST = 2000;
const MULTIPLIER = 1.15;

const levelupCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("levelup")
        .setDescription("Level up your user")
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .addSubcommand((subcommand) => subcommand.setName("max").setDescription("Level up to max level")),
    execute: async (interaction) => {
        const command = interaction.options.getSubcommand()!;
        const user = interaction.user;
        const currentLevel = await joeUser.getLevel(user.id);
        const priceForNextLevel = Math.floor(BASE_COST * Math.pow(MULTIPLIER, currentLevel));

        if (command && command === "max") {
            const maxLevel = Math.floor(Math.log((await joeUser.getBalance(user.id)) / BASE_COST) / Math.log(MULTIPLIER));

            const totalCost = (BASE_COST * (MULTIPLIER ** (maxLevel + 1) - MULTIPLIER ** (currentLevel + 1))) / (MULTIPLIER - 1);

            if (maxLevel <= currentLevel) {
                await interaction.reply(`You need ${formatNumber(priceForNextLevel)} more coins to level up.`);
                return;
            }

            if (!(await joeUser.hasMoney(user.id, totalCost))) {
                await interaction.reply(`Insufficient funds. You need ${formatNumber(totalCost - (await joeUser.getBalance(user.id)))} more coins.`);
            } else {
                await joeUser.withdraw(user.id, totalCost);
                await joeUser.addLevel(user.id, maxLevel - currentLevel);

                await interaction.reply(`You leveled up to \`\`🍕${await joeUser.getLevel(user.id)}\`\` for ${formatNumber(totalCost)} coins.`);
            }

            return;
        }

        if (!(await joeUser.hasMoney(user.id, priceForNextLevel))) {
            await interaction.reply(`Insufficient funds. You need ${formatNumber(priceForNextLevel)} more coins.`);
        } else {
            await joeUser.withdraw(user.id, priceForNextLevel);
            await joeUser.addLevel(user.id, 1);

            await interaction.reply(`You leveled up to \`\`🍕${await joeUser.getLevel(user.id)}\`\` for ${formatNumber(priceForNextLevel)} coins.`);
        }
    },
};

export default levelupCommand;
