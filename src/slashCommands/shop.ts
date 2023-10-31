import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import autoBuy from "~/functions/autobuy";
import formatNumber from "~/functions/numberUtils";
import { shops } from "~/functions/shops";
import { prisma } from "~/index";
import joeUser from "~/internal/joeUser";
import { Command, SlashCommand } from "~/types";

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
                    const price = shop.price * Math.pow(shop.priceExponent, userShop?.amountOwned ?? 0);
                    const incomePerSecond = shop.incomePerSecond * (userShop?.amountOwned ?? 0);

                    embed.addFields({
                        name: `\`\`${shop.name}\`\``,
                        value: `Price: $${formatNumber(price)} ($${formatNumber(shop.price)} @ x${shop.priceExponent}) 
        Income Per Second: $${formatNumber(incomePerSecond)} ($${formatNumber(shop.incomePerSecond)})
        Owned: ${formatNumber(userShop?.amountOwned ?? 0)}
        Profit: $${formatNumber(userShop?.profit ?? 0)}`,
                    });
                }
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (option === "buy") {
            const type = interaction.options.getString("type")!;
            const count = interaction.options.getInteger("count") ?? 1;

            if (type === "auto") {
                const currentBalance = await joeUser.getBalance(interaction.user.id);
                const purchaseSummary = autoBuy(currentBalance, shops);

                let totalSpent = 0;
                let replyMsg = "You bought: \n";
                for (const summary of purchaseSummary) {
                    totalSpent += summary.totalSpent;
                    replyMsg += `${summary.shopName}: ${summary.amountOwned} units\n`;
                    await prisma.shop.upsert({
                        where: {
                            shopId_ownerId: {
                                shopId: shops.find((shop) => shop.name === summary.shopName)!.id,
                                ownerId: interaction.user.id,
                            },
                        },
                        update: {
                            amountOwned:
                                (userShops.find((userShop) => userShop.shopId === shops.find((shop) => shop.name === summary.shopName)!.id)?.amountOwned ?? 0) +
                                summary.count,
                        },
                        create: {
                            ownerId: interaction.user.id,
                            shopId: shops.find((shop) => shop.name === summary.shopName)!.id,
                            amountOwned: summary.count,
                        },
                    });
                }

                joeUser.withdraw(interaction.user.id, totalSpent);
                await interaction.reply(replyMsg + `\nTotal spent: $${formatNumber(totalSpent)}`);
            } else {

                const shop = shops.filter((shop) => shop.name === type)[0];

                if (!type || !shop) {
                    await interaction.reply("Invalid shop type.");
                    return;
                }

                const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
                const amountOwned = userShop?.amountOwned ?? 0;

                const price = shop.price * Math.pow(shop.priceExponent, amountOwned);
                const priceForCount = price * count;
                const currentBalance = await joeUser.getBalance(interaction.user.id);
            
                if (priceForCount > currentBalance) {
                    const missingAmount = priceForCount - currentBalance;
                    await interaction.reply(`Insufficient funds. You need $${formatNumber(missingAmount)} more to buy ${count} \`\`${shop.name}\`\`.`);
                    return;
                }
            
                joeUser.withdraw(interaction.user.id, priceForCount);
            
                await prisma.shop.upsert({
                    where: {
                        shopId_ownerId: {
                            shopId: shop.id,
                            ownerId: interaction.user.id,
                        },
                    },
                    update: {
                        amountOwned: (userShop?.amountOwned ?? 0) + count,
                    },
                    create: {
                        ownerId: interaction.user.id,
                        shopId: shop.id,
                        amountOwned: count,
                    },
                });
            
                await interaction.reply(`You bought ${count} \`\`${shop.name}\`\` for a total of $${formatNumber(priceForCount)}.`);
            }
            }
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
