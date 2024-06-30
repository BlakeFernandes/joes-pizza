import { SlashCommandBuilder, TextChannel } from "discord.js";
import { formatNumber, toBigNumber } from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";
import { prisma } from "..";

const baltopCommand: SlashCommand = {
    command: new SlashCommandBuilder().setName("baltop").setDescription("View the richest members"),

    execute: async (interaction) => {
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

        const topUsers = await joeUser.getTopBalances();
        let response = "**Top Users by Total Balance:**\n";

        topUsers.forEach((user, index) => {
            const bankBalance = user.Bank.length > 0 ? user.Bank[0].balance : 0;
            const totalBalance = user.wallet + bankBalance;
            let medal = "";

            switch (index) {
                case 0:
                    medal = "🥇";
                    break;
                case 1:
                    medal = "🥈";
                    break;
                case 2:
                    medal = "🥉";
                    break;
                default:
                    medal = `${index + 1}.`;
                    break;
            }

            response += `${medal} <@${user.id}>: ${formatNumber(toBigNumber(totalBalance))} coins \`\`🍕${user.level}\`\`\n`;
        });

        await interaction.reply({ content: response, allowedMentions: { repliedUser: true } });
    },
};

export default baltopCommand;
