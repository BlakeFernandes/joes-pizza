import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, TextChannel } from "discord.js";
import { toBigNumber } from "~/functions/numberUtils";
import joeUser from "~/internal/joeUser";
import { SlashCommand } from "~/types";
import { prisma } from "~/index";

const begCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("beg")
        .setDescription("Beg for coins")
        .addIntegerOption((option) => option.setName("amount").setDescription("The amount of money to beg for")) as SlashCommandBuilder,

    execute: async (interaction: ChatInputCommandInteraction) => {
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

        const userBalance = await joeUser.getBalance(interaction.user.id);
        const maxBegAmount = userBalance.div(2).plus(1);
        const amount = interaction.options.getInteger("amount") || maxBegAmount.toNumber();

        if (userBalance.toNumber() >= 50) {
            await interaction.reply({ content: "You can only beg if you have less than 50 coins.", ephemeral: true });
            return;
        }

        if (toBigNumber(amount).gt(maxBegAmount)) {
            await interaction.reply({
                content: `You can only beg for less than half of your current balance plus 1 coin. Maximum you can beg for is ${maxBegAmount.toFixed(
                    0
                )} coins.`,
                ephemeral: true,
            });
            return;
        }

        const begMessage = await channel.send({
            content: `${interaction.user.username} is begging for ${amount} coins. Click a button below!`,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId("giveCoin").setLabel("Give $1").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("laughAtUser").setLabel(`Laugh at ${interaction.user.username}`).setStyle(ButtonStyle.Secondary)
                ),
            ],
        });

        const filter = (i: { customId: string; user: { id: string } }) => i.customId === "giveCoin" || i.customId === "laughAtUser";
        const collector = begMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

        collector.on("collect", async (i) => {
            if (i.customId === "giveCoin") {
                if (i.user.id === interaction.user.id) {
                    await i.reply({ content: "You can't give money to yourself.", ephemeral: true });
                    return;
                }

                const giverHasMoney = await joeUser.hasMoney(i.user.id, toBigNumber(1));
                if (!giverHasMoney) {
                    await i.reply({ content: "You don't have enough money to give.", ephemeral: true });
                    return;
                }

                try {
                    await joeUser.withdraw(i.user.id, toBigNumber(1));
                    await joeUser.deposit(interaction.user.id, toBigNumber(1));
                    await i.reply({
                        content: `${i.user.username} gave $1 to ${interaction.user.username}.`,
                        ephemeral: true,
                    });
                    await begMessage.edit({
                        content: `${interaction.user.username} is begging for ${amount} coins. Click a button below!\n${i.user.username} gave $1.`,
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder().setCustomId("giveCoin").setLabel("Give $1").setStyle(ButtonStyle.Primary),
                                new ButtonBuilder().setCustomId("laughAtUser").setLabel(`Laugh at ${interaction.user.username}`).setStyle(ButtonStyle.Secondary)
                            ),
                        ],
                    });
                } catch (error) {
                    if (error instanceof Error) {
                        await i.reply({ content: `Error: ${error.message}`, ephemeral: true });
                    } else {
                        await i.reply({ content: `Unknown error occurred.`, ephemeral: true });
                    }
                }
            } else if (i.customId === "laughAtUser") {
                await i.reply({
                    content: `<@${interaction.user.id}> [Loser!](https://tenor.com/view/yuh-gif-1183493816882458066)`,
                    allowedMentions: { users: [interaction.user.id] },
                });
            }
        });

        collector.on("end", async () => {
            await begMessage.edit({ components: [] });
        });
    },
};

export default begCommand;
