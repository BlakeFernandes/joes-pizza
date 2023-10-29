import { Client, GatewayIntentBits, Collection, PermissionFlagsBits, ActivityType } from "discord.js";
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
import { Command, SlashCommand } from "./types";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

config();

client.slashCommands = new Collection<string, SlashCommand>();
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, number>();

const handlersDir = join(__dirname, "./handlers");
readdirSync(handlersDir).forEach((handler) => {
    if (!handler.endsWith(".js")) return;
    require(`${handlersDir}/${handler}`)(client);
});

setInterval(async () => {
    const totalCoins = await prisma.user.aggregate({
        _sum: {
            wallet: true,
        },
    });
    client.user.setPresence({
        activities: [
            {
                name: `${totalCoins._sum.wallet.toString()} coins across users!`,
                type: ActivityType.Watching,
            },
        ],
        status: "online",
    });
}, 60000);

client.login(process.env.TOKEN);
