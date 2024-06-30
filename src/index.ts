import { Client, GatewayIntentBits, Collection, ActivityType } from "discord.js";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { SlashCommand, Command } from "./types";
import { toBigNumber } from "./functions/numberUtils";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

export const prisma = new PrismaClient();

config();

client.slashCommands = new Collection<string, SlashCommand>();
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, number>();

const handlersDir = join(__dirname, "./handlers");
readdirSync(handlersDir).forEach((handler) => {
    if (!handler.endsWith(".ts")) return;
    require(`${handlersDir}/${handler}`)(client);
});

setInterval(async () => {
    const users = await prisma.user.findMany({
        select: {
            wallet: true,
        },
    });

    let walletSum = toBigNumber(0);

    for (const user of users) {
        const wallet = toBigNumber(user.wallet);
        walletSum = walletSum.plus(wallet);
    }

    if (client.user) {
        client.user.setPresence({
            activities: [
                {
                    name: `${walletSum.toString()} coins across users!`,
                    type: ActivityType.Watching,
                },
            ],
            status: "online",
        });
    }
}, 60000);

client.login(process.env.TOKEN);
