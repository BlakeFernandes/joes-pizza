import { Client, Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { readdirSync } from "fs";
import { join } from "path";
import { Command, SlashCommand } from "../types";

module.exports = (client: Client) => {
    const slashCommands: SlashCommandBuilder[] = [];
    const commands: Command[] = [];

    let slashCommandsDir = join(__dirname, "../slashCommands");

    const commandFiles = readdirSync(slashCommandsDir);

    for (let i = 0; i < commandFiles.length; i++) {
        let file = commandFiles[i];
        if (!file.endsWith(".js")) continue;
        let command: SlashCommand = require(`${slashCommandsDir}/${file}`).default;
        try {
            slashCommands.push(command.command);
            client.slashCommands.set(command.command.name, command);
        } catch (error) {
            console.log(`Error loading slash command ${file}:`);
        }
    }

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: slashCommands.map((command) => command.toJSON()),
    })
        .then((data: any) => {
            console.log(`🔥 Successfully loaded ${data.length} slash command(s)`);
        })
        .catch((e) => {
            console.log(e);
        });
};
