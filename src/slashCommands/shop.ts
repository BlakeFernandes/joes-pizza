import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import autoBuy from "~/functions/autobuy";
import { formatBigInt } from "~/functions/numberUtils";
import { prisma } from "~/index";
import joeUser from "~/internal/joeUser";
import { Command, SlashCommand } from "~/types";

export type ShopData = {
    id: number;
    name: string;
    price: bigint;
    priceExponent: bigint;
    incomePerSecond: bigint;
};

export const shops: ShopData[] = [
    {
        id: 1,
        name: ":lemon: Little Timmy's Lemonade Stand",
        price: BigInt(200),
        priceExponent: BigInt(1.15),
        incomePerSecond: BigInt(1),
    },
    {
        id: 2,
        name: ":hotdog: Bunnings Sausage Sizzle",
        price: BigInt(1_500),
        priceExponent: BigInt(1.25),
        incomePerSecond: BigInt(5),
    },
    {
        id: 3,
        name: ":icecream: Mr Whippys",
        price: BigInt(10_000),
        priceExponent: BigInt(1.3),
        incomePerSecond: BigInt(20),
    },
    {
        id: 4,
        name: ":hamburger: Maccas",
        price: BigInt(50_000),
        priceExponent: BigInt(1.35),
        incomePerSecond: BigInt(80),
    },
    {
        id: 5,
        name: ":doughnut: Dunkin' Donuts",
        price: BigInt(200_000),
        priceExponent: BigInt(1.4),
        incomePerSecond: BigInt(320),
    },
    {
        id: 6,
        name: ":convenience_store: Muhammad's Diary",
        price: BigInt(700_000),
        priceExponent: BigInt(1.45),
        incomePerSecond: BigInt(1_280),
    },
    {
        id: 7,
        name: ":clapper: Hoyts",
        price: BigInt(2_500_000),
        priceExponent: BigInt(1.5),
        incomePerSecond: BigInt(5_120),
    },
    {
        id: 8,
        name: ":airplane: Al-Qaeda Airline",
        price: BigInt(9_000_000),
        priceExponent: BigInt(1.55),
        incomePerSecond: BigInt(20_480),
    },
    {
        id: 9,
        name: ":rocket: Daddy Musk's Spaceships",
        price: BigInt(32_000_000),
        priceExponent: BigInt(1.6),
        incomePerSecond: BigInt(81_920),
    },
    {
        id: 10,
        name: ":pizza: Joe's Pizza",
        price: BigInt(500_000_000),
        priceExponent: BigInt(1.65),
        incomePerSecond: BigInt(327_680),
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

            const highestOwnedShopId = userShops.reduce((max, shop) => Math.max(max, shop.shopId), 0);

            for (const shop of shops) {
                if (shop.id <= highestOwnedShopId + 1) {
                    const userShop = userShops.find((us) => us.shopId === shop.id);
                    const price = shop.price * (shop.priceExponent^(userShop?.amountOwned ?? BigInt(0)));
                    const incomePerSecond = shop.incomePerSecond * userShop?.amountOwned;

                    embed.addFields({
                        name: `\`\`${shop.name}\`\``,
                        value: `Price: $${formatBigInt(price)} ($${formatBigInt(shop.price)} @ x${shop.priceExponent}) 
            Income Per Second: $${formatBigInt(incomePerSecond)} ($${formatBigInt(shop.incomePerSecond)})
            Owned: ${formatBigInt(userShop?.amountOwned)}
            Profit: $${formatBigInt(userShop?.profit)}`,
                    });
                }
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (option === "buy") {
            const type = interaction.options.getString("type")!;

            const shop = shops.filter((shop) => shop.name === type)[0];

            if (!type || !shop) {
                await interaction.reply("Invalid shop type.");
                return;
            }

            const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
            const amountOwned = userShop?.amountOwned ?? BigInt(0);

            const price = shop.price * (shop.priceExponent^amountOwned);
            const currentBalance = await joeUser.getBalance(interaction.user.id);

            if (price > currentBalance) {
                const missingAmount = price - currentBalance;
                await interaction.reply(`Insufficient funds. You need $${formatBigInt(missingAmount)} more to buy \`\`${shop.name}\`\`.`);
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
                    amountOwned: (userShop?.amountOwned ?? BigInt(0)) + BigInt(1),
                },
                create: {
                    ownerId: interaction.user.id,
                    shopId: shop.id,
                    amountOwned: 1,
                },
            });

            await interaction.reply(`You bought a \`\`${shop.name}\`\` for $${formatBigInt(price)}.`);
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