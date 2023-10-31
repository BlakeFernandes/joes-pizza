import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import formatNumber from "~/functions/numberUtils";
import { prisma } from "~/index";
import joeUser from "~/internal/joeUser";
import { Command, SlashCommand } from "~/types";

export type ShopData = {
    id: number;
    name: string;
    price: number;
    priceExponent: number;
    incomePerSecond: number;
};

export const shops: ShopData[] = [
    {
        id: 1,
        name: "🍋 Little Timmy's Lemonade Stand",
        price: 5_000,
        priceExponent: 1.2,
        incomePerSecond: 30,
    },
    {
        id: 2,
        name: "🌭 Bunnings Sausage Sizzle",
        price: 80_000,
        priceExponent: 1.25,
        incomePerSecond: 180,
    },
    {
        id: 3,
        name: "🍦 Mr Whippys",
        price: 400_000,
        priceExponent: 1.3,
        incomePerSecond: 800,
    },
    {
        id: 4,
        name: "🍔 Maccas",
        price: 2_000_000,
        priceExponent: 1.35,
        incomePerSecond: 3_000,
    },
    {
        id: 5,
        name: "🍩 Dunkin' Donuts",
        price: 5_000_000,
        priceExponent: 1.4,
        incomePerSecond: 7_500,
    },
    {
        id: 6,
        name: "🏪 Muhammad's Diary",
        price: 15_000_000,
        priceExponent: 1.45,
        incomePerSecond: 20_000,
    },
    {
        id: 7,
        name: "🎬 Hoyts",
        price: 40_000_000,
        priceExponent: 1.5,
        incomePerSecond: 50_000,
    },
    {
        id: 8,
        name: "🍕 Freddy Fazbear's Pizza",
        price: 90_000_000,
        priceExponent: 1.55,
        incomePerSecond: 100_000,
    },
    {
        id: 9,
        name: "🚀 Daddy Musk's Spaceships",
        price: 200_000_000,
        priceExponent: 1.6,
        incomePerSecond: 250_000,
    },
    {
        id: 10,
        name: "🍕 Joe's Pizza",
        price: 500_000_000,
        priceExponent: 1.65,
        incomePerSecond: 500_000,
    },
];

const shopCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("View Shops")
        .addStringOption((option) => option.setName("option").setDescription("Option to execute").setAutocomplete(true))
        .addStringOption((option) => option.setName("type").setDescription("Select the shop type").setAutocomplete(true).setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    autocomplete: async (interaction) => {
        const focusedOption = interaction.options.getFocused(true);
        let choices;

        if (focusedOption.name === "option") {
            choices = ["view", "buy"];
        }

        if (focusedOption.name === "type") {
            choices = shops.map((shop) => shop.name);
        }

        const filtered = choices?.filter((choice) => choice.startsWith(focusedOption.value));

        await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
    },
    execute: async (interaction) => {
        const option = interaction.options.getString("option")!;

        const userShops = await prisma.shop.findMany({
            where: {
                ownerId: interaction.user.id,
            },
        });

        if (option === "view") {
            const embed = new EmbedBuilder().setTitle("Shop").setDescription("Buy stuff to make more money!");

            for (const shop of shops) {
                const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
                const price = shop.price * Math.pow(shop.priceExponent, userShop?.amountOwned ?? 1);
                const incomePerSecond = shop.incomePerSecond * (userShop?.amountOwned ?? 0);

                embed.addFields({
                    name: `\`\`${shop.name}\`\``,
                    value: `Price: $${formatNumber(price)} ($${formatNumber(shop.price)} @ x${shop.priceExponent}) 
        Income Per Second: $${formatNumber(incomePerSecond)} ($${formatNumber(shop.incomePerSecond)})
        Owned: ${formatNumber(userShop?.amountOwned) ?? 0}
        Profit: $${formatNumber(userShop?.profit) ?? 0}`,
                });
            }

            await interaction.reply({ embeds: [embed] });
        }

        if (option === "buy") {
            const type = interaction.options.getString("type")!;

            const shop = shops.filter((shop) => shop.name === type)[0];

            if (!type || !shop) {
                await interaction.reply("Invalid shop type.");
                return;
            }

            const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
            const amountOwned = userShop?.amountOwned ?? 0;

            const price = shop.price * Math.pow(shop.priceExponent, amountOwned);
            const currentBalance = await joeUser.getBalance(interaction.user.id);

            if (price > currentBalance) {
                const missingAmount = price - currentBalance;
                await interaction.reply(`Insufficient funds. You need $${formatNumber(missingAmount)} more to buy \`\`${shop.name}\`\`.`);
                return;
            }

            joeUser.withdraw(interaction.user.id, price);

            await prisma.shop.upsert({
                where: {
                    shopId_ownerId: {
                        shopId: shop.id,
                        ownerId: interaction.user.id,
                    },
                },
                update: {
                    amountOwned: (userShop?.amountOwned ?? 0) + 1,
                },
                create: {
                    ownerId: interaction.user.id,
                    shopId: shop.id,
                    amountOwned: 1,
                },
            });

            await interaction.reply(`You bought a \`\`${shop.name}\`\` for $${formatNumber(price)}.`);
        }
    },
};

setInterval(async () => {
    const userShops = await prisma.shop.findMany();
    userShops.forEach(async (userShop) => {
        const user = userShop.ownerId;
        const amountOwned = userShop.amountOwned;
        const incomePerSecond = shops.filter((shop2) => shop2.id === userShop.shopId)[0].incomePerSecond;

        const out = amountOwned * incomePerSecond;

        if (out > 0) {
            await joeUser.deposit(user, out);
            await prisma.shop.update({
                where: {
                    shopId_ownerId: {
                        ownerId: user,
                        shopId: userShop.shopId,
                    },
                },
                data: {
                    profit: {
                        increment: out,
                    },
                },
            });
        }
    });
}, 1000);

console.log("🍕 Shop Interval Started!");

export default shopCommand;
