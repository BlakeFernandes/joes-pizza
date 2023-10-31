import { SlashCommandBuilder } from "discord.js";
import formatNumber from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";

const baltopCommand: SlashCommand = {
    command: new SlashCommandBuilder().setName("baltop").setDescription("View the richest members"),
    execute: async (interaction) => {
        const topUsers = await joeUser.getTopBalances();
        let response = "**Top Users by Balance:**\n";

        topUsers.forEach((user, index) => {
            response += `${index + 1}. <@${user.id}>: ${formatNumber(user.wallet)} coins \`\`🍕${user.level}\`\`\n`;
        });

        await interaction.reply({ content: response, allowedMentions: { repliedUser: true } });
    },
};

export default baltopCommand;
