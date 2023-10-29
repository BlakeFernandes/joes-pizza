import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
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
        name: "``🍋 Lemonade Stand``",
        price: 1000,
        priceExponent: 1.15,
        incomePerSecond: 1,
    },
    {
        id: 2,
        name: "``🌭 Bunnings Sausage Sizzle``",
        price: 50_000,
        priceExponent: 1.5,
        incomePerSecond: 10,
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
            choices = ["shop", "buy", "stats"];
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

        if (option === "shop") {
            const embed = new EmbedBuilder().setTitle("Shop").setDescription("Buy stuff to make more money!");

            for (const shop of shops) {
                const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
                const price = Math.round(shop.price * Math.pow(shop.priceExponent, userShop?.amountOwned ?? 1));
                const incomePerSecond = shop.incomePerSecond * (userShop?.amountOwned ?? 0);

                embed.addFields({
                    name: shop.name,
                    value: `Price: $${price} ($${shop.price} @ x${shop.priceExponent}) 
        Income Per Second: $${incomePerSecond} ($${shop.incomePerSecond})
        Owned: ${userShop?.amountOwned ?? 0}
        Profit: $${userShop?.profit ?? 0}`,
                });
            }

            await interaction.reply({ embeds: [embed] });
        }

        // if (option === "buy") {
        //     const type = interaction.options.getString("type")!;

        //     const shop = shops.filter((shop) => shop.name === type)[0];

        //     if (!type || !shop) {
        //         await interaction.reply("Invalid shop type.");
        //         return;
        //     }

        //     const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
        //     const amountOwned = userShop?.amountOwned ?? 0;

        //     const price = Math.round(shop.price * Math.pow(shop.priceExponent, amountOwned));
        //     const currentBalance = await joeUser.getBalance(interaction.user.id);

        //     if (price > currentBalance) {
        //         const missingAmount = price - currentBalance;
        //         await interaction.reply(`Insufficient funds. You need $${Math.round(missingAmount)} more to buy ${shop.name}.`);
        //         return;
        //     }

        //     joeUser.withdraw(interaction.user.id, price);

        //     await prisma.shop.upsert({
        //         where: {
        //             shopId_ownerId: {
        //                 shopId: shop.id,
        //                 ownerId: interaction.user.id,
        //             },
        //         },
        //         update: {
        //             amountOwned: (userShop?.amountOwned ?? 0) + 1,
        //         },
        //         create: {
        //             ownerId: interaction.user.id,
        //             shopId: shop.id,
        //             amountOwned: 1,
        //         },
        //     });

        //     await interaction.reply(`You bought a ${shop.name} for $${Math.round(price)}.`);
        // }

        if (option === "buy") {
            const type = interaction.options.getString("type")!;
            const quantity = interaction.options.getInteger("quantity") || 1; // Defaults to 1 if no quantity specified
        
            const shop = shops.filter((shop) => shop.name === type)[0];
        
            if (!type || !shop) {
                await interaction.reply("Invalid shop type.");
                return;
            }
        
            const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
            const amountOwned = userShop?.amountOwned ?? 0;
        
            // Calculate total price for the desired quantity
            let totalPrice = 0;
            for (let i = 0; i < quantity; i++) {
                totalPrice += Math.round(shop.price * Math.pow(shop.priceExponent, amountOwned + i));
            }
        
            const currentBalance = await joeUser.getBalance(interaction.user.id);
        
            if (totalPrice > currentBalance) {
                const missingAmount = totalPrice - currentBalance;
                await interaction.reply(`Insufficient funds. You need $${Math.round(missingAmount)} more to buy ${quantity} ${shop.name}(s).`);
                return;
            }
        
            joeUser.withdraw(interaction.user.id, totalPrice);
        
            await prisma.shop.upsert({
                where: {
                    shopId_ownerId: {
                        shopId: shop.id,
                        ownerId: interaction.user.id,
                    },
                },
                update: {
                    amountOwned: (userShop?.amountOwned ?? 0) + quantity,
                },
                create: {
                    ownerId: interaction.user.id,
                    shopId: shop.id,
                    amountOwned: quantity,
                },
            });
        
            await interaction.reply(`You bought ${quantity} ${shop.name}(s) for $${Math.round(totalPrice)}.`);
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
