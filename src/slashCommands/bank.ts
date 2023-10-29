import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "~/types";

export type BankData = {
  id: number;
  name: string;
  price: number;
  maxBalance;
  maxCompound;
};

export const banks: BankData[] = [
  {
    id: 1,
    name: "ANZ",
    price: 100,
    maxBalance: 10000,
    maxCompound: 0.05,
  },
];

const bankCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("View Banks")
    .addStringOption((option) =>
      option
        .setName("option")
        .setDescription("Option to execute")
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
  autocomplete: async (interaction) => {
    const focusedOption = interaction.options.getFocused(true);
    let choices;

    if (focusedOption.name === "option") {
      choices = ["list"];
    }

    if (focusedOption.name === "type") {
      choices = banks.forEach((shop) => shop.name);
    }

    const filtered = choices.filter((choice) =>
      choice.startsWith(focusedOption.value)
    );

    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice }))
    );
  },
  execute: async (interaction) => {
    const option = interaction.options.getString("option")!;

    if (option === "list") {
      const embed = new EmbedBuilder()
        .setTitle("bank")
        .setDescription(
          "Join a bank to store your money, earn interest and get loans."
        );

      for (const bank of banks) {
        embed.addFields({
          name: bank.name,
          value: `Price: ${bank.price} coins\nMax Balance: ${bank.maxBalance} coins\nMax Compound: ${bank.maxCompound} coins`,
        });
      }

      await interaction.reply({ embeds: [embed] });
    }
  },
  cooldown: 1,
};

export default bankCommand;