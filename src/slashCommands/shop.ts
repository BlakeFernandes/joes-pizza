import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";
import { prisma } from "~/index";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";
import { formatNumber, toBigNumber, toPrismaString } from "~/functions/numberUtils";

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
        price: 1000,
        priceExponent: 1.1,
        incomePerSecond: 10,
    },
    {
        id: 2,
        name: "🌭 Bunnings Sausage Sizzle",
        price: 5000,
        priceExponent: 1.15,
        incomePerSecond: 50,
    },
    {
        id: 3,
        name: "🍦 Mr Whippys",
        price: 20000,
        priceExponent: 1.2,
        incomePerSecond: 200,
    },
    {
        id: 4,
        name: "🍔 Maccas",
        price: 80000,
        priceExponent: 1.25,
        incomePerSecond: 800,
    },
    {
        id: 5,
        name: "🍩 Dunkin' Donuts",
        price: 320000,
        priceExponent: 1.3,
        incomePerSecond: 3200,
    },
    {
        id: 6,
        name: "🏪 Generic Convenience Store",
        price: 1280000,
        priceExponent: 1.35,
        incomePerSecond: 12800,
    },
    {
        id: 7,
        name: "🎬 Hoyts",
        price: 5120000,
        priceExponent: 1.4,
        incomePerSecond: 51200,
    },
    {
        id: 8,
        name: "✈️ Generic Airline",
        price: 20480000,
        priceExponent: 1.45,
        incomePerSecond: 204800,
    },
    {
        id: 9,
        name: "🚀 Generic Spaceships",
        price: 81920000,
        priceExponent: 1.5,
        incomePerSecond: 819200,
    },
    {
        id: 10,
        name: "🍕 Joe's Pizza",
        price: 327680000,
        priceExponent: 1.55,
        incomePerSecond: 3276800,
    },
];

const shopCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("View Shops")
        .addStringOption((option) => option.setName("option").setDescription("Option to execute").setAutocomplete(true).setRequired(false))
        .addStringOption((option) => option.setName("type").setDescription("Select the shop type").setAutocomplete(true).setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) as SlashCommandBuilder,
    autocomplete: async (interaction) => {
        const focusedOption = interaction.options.getFocused(true);
        let choices: any[] = [];

        if (focusedOption.name === "option") {
            choices = ["view", "buy"];
        }

        if (focusedOption.name === "type") {
            choices = shops.map((shop) => shop.name);
        }

        const filtered = choices.filter((choice: string) => choice.startsWith(focusedOption.value));

        await interaction.respond(filtered.map((choice: any) => ({ name: choice, value: choice })));
    },
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
        const option = interaction.options.getString("option");

        const userShops = await prisma.shop.findMany({
            where: {
                ownerId: interaction.user.id,
            },
        });

        if (!option || option === "view") {
            const embed = new EmbedBuilder().setTitle("Shop").setDescription("Buy stuff to make more money!");

            const highestOwnedShopId = userShops.reduce((max: number, shop: { shopId: number }) => Math.max(max, shop.shopId), 0);

            for (const shop of shops) {
                if (shop.id <= highestOwnedShopId + 1) {
                    const userShop = userShops.find((us: { shopId: number }) => us.shopId === shop.id);
                    const price = toBigNumber(shop.price).times(toBigNumber(shop.priceExponent).pow(userShop?.amountOwned ?? 0));
                    const incomePerSecond = toBigNumber(shop.incomePerSecond).times(userShop?.amountOwned ?? 0);

                    embed.addFields({
                        name: `\`\`${shop.name}\`\``,
                        value: `Price: $${formatNumber(price)} ($${formatNumber(toBigNumber(shop.price))} @ x${shop.priceExponent}) 
        Income Per Second: $${formatNumber(incomePerSecond)} ($${formatNumber(toBigNumber(shop.incomePerSecond))})
        Owned: ${formatNumber(toBigNumber(userShop?.amountOwned ?? 0))}
        Profit: $${formatNumber(toBigNumber(userShop?.profit ?? 0))}`,
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

            const userShop = userShops.filter((userShop: { shopId: number }) => userShop.shopId === shop.id)[0];
            const amountOwned = userShop?.amountOwned ?? 0;

            const price = toBigNumber(shop.price).times(toBigNumber(shop.priceExponent).pow(amountOwned));
            const currentBalance = toBigNumber(await joeUser.getBalance(interaction.user.id));

            if (price.gt(currentBalance)) {
                const missingAmount = price.minus(currentBalance);
                await interaction.reply(`Insufficient funds. You need $${formatNumber(missingAmount)} more to buy \`\`${shop.name}\`\`.`);
                return;
            }

            await joeUser.withdraw(interaction.user.id, price);

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
                    amountOwned: toBigNumber(1).toString(),
                },
            });

            await interaction.reply(`You bought a \`\`${shop.name}\`\` for $${formatNumber(price)}.`);
        }
    },
};

setInterval(async () => {
    const userShops = await prisma.shop.findMany();
    for (const userShop of userShops) {
        const user = userShop.ownerId;
        const amountOwned = toBigNumber(userShop.amountOwned);
        const incomePerSecond = shops.find((shop2) => shop2.id === userShop.shopId)?.incomePerSecond ?? 0;

        const out = amountOwned.times(incomePerSecond);

        if (out.gt(0)) {
            await joeUser.deposit(user, out);
            await prisma.shop.update({
                where: {
                    shopId_ownerId: {
                        ownerId: user,
                        shopId: userShop.shopId,
                    },
                },
                data: {
                    profit: toPrismaString(toBigNumber(userShop.profit).plus(out)),
                },
            });
        }
    }
}, 1000);

console.log("🍕 Shop Interval Started!");

export default shopCommand;
