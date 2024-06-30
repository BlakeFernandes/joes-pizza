import { PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "~/types";
import { prisma } from "..";
import joeUser from "~/internal/joeUser";
import joeBank from "~/internal/joeBank";
import { formatNumber, toBigNumber, toPrismaString } from "~/functions/numberUtils";
import BigNumber from "bignumber.js";

export type BankData = {
    id: number;
    name: string;
    levelRequired: number;
    maxBalance: BigNumber;
    maxCompound: number;
};

export const banks: BankData[] = [
    {
        id: 1,
        name: "Joe's Pizzeria Bank",
        levelRequired: 10,
        maxBalance: toBigNumber(1000000), // Increased to allow more growth
        maxCompound: 0.0005, // Adjusted for a more significant compound rate
    },
];

const mainBank = banks.find((bank) => bank.id === 1);
const maxBalance = (level: number) => {
    if (mainBank) {
        return toBigNumber(mainBank.maxBalance).times(level);
    }
    return toBigNumber(0);
};
const maxCompound = (level: number) => {
    if (mainBank) {
        return toBigNumber(mainBank.maxCompound).times(level);
    }
    return toBigNumber(0);
};

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
        .addSubcommand((subcommand) => subcommand.setName("view").setDescription("View your bank stats"))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) as SlashCommandBuilder,
    execute: async (interaction) => {
        const option = interaction.options.getSubcommand()!;

        if (option === "join") {
            const bank = banks.find((bank) => bank.id === 1);
            if (!bank) {
                await interaction.reply("Bank not found.");
                return;
            }

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
            const amount = toBigNumber(interaction.options.getInteger("amount")!);

            const bank = banks.find((bank) => bank.id === 1);
            if (!bank) {
                await interaction.reply("Bank not found.");
                return;
            }

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
                const userLevel = await joeUser.getLevel(interaction.user.id);
                const userMaxBalance = maxBalance(userLevel);

                const userBalance = toBigNumber(await joeUser.getBalance(interaction.user.id));

                if (amount.gt(userBalance)) {
                    await interaction.reply(`Insufficient funds. You need ${formatNumber(amount.minus(userBalance))} more coins.`);
                    return;
                }

                const maxAllowedDeposit = userMaxBalance.minus(userBank.balance);

                if (amount.gt(maxAllowedDeposit)) {
                    await interaction.reply(
                        `You can only deposit up to ${formatNumber(maxAllowedDeposit)} more coins into ${bank.name} to not exceed your bank's max balance.`
                    );
                    return;
                }

                await joeBank.deposit({
                    userId: interaction.user.id,
                    bankId: bank.id,
                    amount: amount,
                });
                await interaction.reply(`You deposited ${formatNumber(amount)} coins into your ${bank.name} account.`);
            } else if (option === "withdraw") {
                if (amount.gt(userBank.balance)) {
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

        if (option === "view") {
            const embed = new EmbedBuilder().setTitle("Bank").setDescription("Join a bank to store your money, earn interest, and get loans.");
            const level = await joeUser.getLevel(interaction.user.id);
            const userBanks = await prisma.bank.findMany({
                where: {
                    ownerId: interaction.user.id,
                },
            });
            const bank = banks.find((bank) => bank.id === 1);
            if (!bank) {
                await interaction.reply("Bank not found.");
                return;
            }
            const userBank = userBanks.find((userBank: { bankId: number }) => userBank.bankId === bank.id);
            if (!userBank) {
                await interaction.reply(`You don't have a bank account with \`\`${bank.name}\`\`.`);
                return;
            }
            const roundedInterest = maxCompound(level).toFixed(6);

            embed.addFields({
                name: `${bank.name} \`\`🍕${bank.levelRequired}\`\``,
                value: `Balance: $${formatNumber(toBigNumber(userBank.balance))}/$${formatNumber(
                    maxBalance(level)
                )} coins\nInterest: ${roundedInterest}% coins\nProfit: $${formatNumber(toBigNumber(userBank.profit))}`,
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    cooldown: 1,
};

setInterval(async () => {
    const userBanks = await prisma.bank.findMany();
    for (const userBank of userBanks) {
        const balance = toBigNumber(userBank.balance);
        const profit = toBigNumber(userBank.profit);
        const bankData = banks.find((bank) => bank.id === userBank.bankId);

        if (bankData) {
            const interest = balance.times(bankData.maxCompound);
            const newProfit = profit.plus(interest);
            const newBalance = balance.plus(interest);

            await prisma.bank.update({
                where: {
                    bankId_ownerId: {
                        ownerId: userBank.ownerId,
                        bankId: userBank.bankId,
                    },
                },
                data: {
                    balance: toPrismaString(newBalance),
                    profit: toPrismaString(newProfit),
                },
            });
        }
    }
}, 1000);

console.log("🏦 Bank Interval Started!");

export default bankCommand;
