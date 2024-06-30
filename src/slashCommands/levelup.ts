import { PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";
import BigNumber from "bignumber.js";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";
import { formatNumber, toBigNumber } from "~/functions/numberUtils";
import { prisma } from "..";

const BASE_COST = toBigNumber(2000);
const MULTIPLIER = toBigNumber(1.15);

const calculateMaxLevel = (balance: BigNumber, baseCost: BigNumber, multiplier: BigNumber, currentLevel: number): number => {
    let maxLevel = currentLevel;
    let price = baseCost.times(multiplier.pow(maxLevel));
    let totalPrice = toBigNumber(0);

    while (totalPrice.plus(price).lte(balance)) {
        totalPrice = totalPrice.plus(price);
        maxLevel += 1;
        price = baseCost.times(multiplier.pow(maxLevel));
    }

    return maxLevel;
};

const levelupCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("levelup")
        .setDescription("Level up your user")
        .addSubcommand((subcommand) => subcommand.setName("max").setDescription("Level up to max level"))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) as SlashCommandBuilder,
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
        const command = interaction.options.getSubcommand(false);
        const user = interaction.user;
        const currentLevel = toBigNumber(await joeUser.getLevel(user.id));
        const balance = toBigNumber(await joeUser.getBalance(user.id));
        const price = BASE_COST.times(MULTIPLIER.pow(currentLevel));

        if (command && command === "max") {
            const maxLevel = calculateMaxLevel(balance, BASE_COST, MULTIPLIER, currentLevel.toNumber());
            const totalPrice = BASE_COST.times(MULTIPLIER.pow(currentLevel.toNumber()).minus(MULTIPLIER.pow(currentLevel.toNumber())))
                .div(MULTIPLIER.minus(1))
                .integerValue(BigNumber.ROUND_FLOOR);

            if (balance.lt(totalPrice)) {
                await interaction.reply(`Insufficient funds. You need ${formatNumber(totalPrice.minus(balance))} more coins.`);
            } else {
                await joeUser.withdraw(user.id, totalPrice);
                await joeUser.addLevel(user.id, maxLevel - currentLevel.toNumber());

                await interaction.reply(`You leveled up to \`\`🍕${await joeUser.getLevel(user.id)}\`\` for ${formatNumber(totalPrice)} coins.`);
            }

            return;
        }

        if (balance.lt(price)) {
            await interaction.reply(`Insufficient funds. You need ${formatNumber(price.minus(balance))} more coins.`);
        } else {
            await joeUser.withdraw(user.id, price);
            await joeUser.addLevel(user.id, 1);

            await interaction.reply(`You leveled up to \`\`🍕${await joeUser.getLevel(user.id)}\`\` for ${formatNumber(price)} coins.`);
        }
    },
};

export default levelupCommand;
