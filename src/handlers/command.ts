import { Client, Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { SlashCommand } from "../types";

module.exports = async (client: Client) => {
    const slashCommands: SlashCommandBuilder[] = [];

    const loadCommands = (dir: string) => {
        const commandFiles = readdirSync(dir);
        for (const file of commandFiles) {
            const filePath = join(dir, file);
            if (statSync(filePath).isDirectory()) {
                loadCommands(filePath);
            } else if (file.endsWith(".ts")) {
                const command: SlashCommand = require(filePath).default;
                try {
                    slashCommands.push(command.command);
                    client.slashCommands.set(command.command.name, command);
                } catch (error) {
                    console.log(`Error loading slash command ${file}:`, error);
                }
            }
        }
    };

    const slashCommandsDir = join(__dirname, "../slashCommands");
    loadCommands(slashCommandsDir);

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);

    try {
        const data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
            body: slashCommands.map((command) => command.toJSON()),
        });
        console.log(`🔥 Successfully loaded ${(data as any).length} slash command(s)`);
    } catch (error) {
        console.log("Error registering slash commands:", error);
    }
};
