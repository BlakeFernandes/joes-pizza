import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "~/types";
import { prisma } from "..";
import joeUser from "~/internal/joeUser";
import joeBank from "~/internal/joeBank";
import formatNumber from "~/functions/numberUtils";

export type BankData = {
    id: number;
    name: string;
    levelRequired: number;
    maxBalance;
    maxCompound;
};

export const banks: BankData[] = [
    {
        id: 1,
        name: "Joe's Pizzeria Bank",
        levelRequired: 10,
        maxBalance: 10000,
        maxCompound: 0.05,
    },
];

const bankCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("bank")
        .setDescription("View Banks")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("deposit")
                .setDescription("Deposit coins")
                .addIntegerOption((option) => option.setName("amount").setDescription("amount to deposit").setRequired(true))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("withdraw")
                .setDescription("Withdraw coins")
                .addIntegerOption((option) => option.setName("amount").setDescription("amount to withdraw").setRequired(true))
    )
        .addSubcommand((subcommand) => subcommand.setName("join").setDescription("Join the bank"))
        .addSubcommand((subcommand) => subcommand.setName("stats").setDescription("View your bank stats"))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    execute: async (interaction) => {
        const option = interaction.options.getSubcommand()!;

        if (option === "join") {
            const bank = banks.find((bank) => bank.id === 1);

            const userBank = await prisma.bank.findUnique({
                where: {
                    bankId_ownerId: {
                        ownerId: interaction.user.id,
                        bankId: bank.id,
                    },
                },
            });

            if (userBank) {
                await interaction.reply(`You already have a bank account with \`\`${bank.name}\`\`.`);
                return;
            }

            if ((await joeUser.getLevel(interaction.user.id)) < bank.levelRequired) {
                await interaction.reply(`You need to be level \`\`🍕${bank.levelRequired}\`\` to join \`\`${bank.name}\`\`.`);
                return;
            }

            await joeBank.join({
                userId: interaction.user.id,
                bankId: bank.id,
            });

            await interaction.reply(`You joined \`\`${bank.name}\`\`!`);
        }

        if (option === "deposit" || option === "withdraw") {
            const amount = interaction.options.getInteger("amount")!;

            const bank = banks.find((bank) => bank.id === 1);

            const userBank = await prisma.bank.findUnique({
                where: {
                    bankId_ownerId: {
                        ownerId: interaction.user.id,
                        bankId: bank.id,
                    },
                },
            });

            if (!userBank) {
                await interaction.reply(`You don't have a bank account with \`\`${bank.name}\`\`.`);
                return;
            }

            if (option === "deposit") {
                if (amount > (await joeUser.getBalance(interaction.user.id))) {
                    await interaction.reply(
                        `Insufficient funds. You need ${formatNumber(amount - (await joeUser.getBalance(interaction.user.id)))} more coins.`
                    );
                    return;
                }

                if (amount + userBank.balance > bank.maxBalance) {
                    await interaction.reply(`You can only deposit up to ${formatNumber(bank.maxBalance)} coins into ${bank.name}.`);
                    return;
                }

                await joeBank.deposit({
                    userId: interaction.user.id,
                    bankId: bank.id,
                    amount: amount,
                });
                await interaction.reply(`You deposited ${formatNumber(amount)} coins into your ${bank.name} account.`);
            } else if (option === "withdraw") {
                if (amount > userBank.balance) {
                    await interaction.reply(`Insufficient funds in bank.`);
                    return;
                }

                await joeBank.withdraw({
                    userId: interaction.user.id,
                    bankId: bank.id,
                    amount: amount,
                });
                await interaction.reply(`You withdrew ${formatNumber(amount)} coins from your ${bank.name} account.`);
            }
        }

        if (option === "stats") {
            const embed = new EmbedBuilder().setTitle("bank").setDescription("Join a bank to store your money, earn interest and get loans.");

            const userBanks = await prisma.bank.findMany({
                where: {
                    ownerId: interaction.user.id,
                },
            });

            for (const bank of banks) {
                const userBank = userBanks.find((userBank) => userBank.bankId === bank.id);

                embed.addFields({
                    name: `${bank.name} \`\`🍕${bank.levelRequired}\`\``,
                    value: `Balance: ${formatNumber(userBank.balance)}/${formatNumber(bank.maxBalance)} coins`,
                });
            }

            await interaction.reply({ embeds: [embed] });
        }

        if (option === "list") {
            const embed = new EmbedBuilder().setTitle("bank").setDescription("Join a bank to store your money, earn interest and get loans.");

            for (const bank of banks) {
                embed.addFields({
                    name: `${bank.name} 🍕${bank.levelRequired}`,
                    value: `Max Balance: ${formatNumber(bank.maxBalance)} coins\nMax Interest: ${formatNumber(bank.maxCompound)} coins`,
                });
            }

            await interaction.reply({ embeds: [embed] });
        }
    },
    cooldown: 1,
};

export default bankCommand;
