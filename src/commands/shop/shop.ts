import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const shopCommand = new SlashCommandBuilder()
  .setName("shop")
  .setDescription("View Shops")
  .addStringOption((option) =>
    option
      .setName("option")
      .setDescription("Option to execute")
      .setAutocomplete(true)
);

export type ShopData = {
  name: string;
  price: number;
  priceExponent: number;
  incomePerSecond: number;
}
  
const shops: ShopData[] = [
  {
    name: "Lemonade Stand",
    price: 1000,
    priceExponent: 1.15,
    incomePerSecond: 1,
  },
];

export async function autocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  let choices;

  if (focusedOption.name === "option") {
    choices = [
      "shop",
      "buy",
      "stats"
    ];
  }

  if (focusedOption.name === "version") {
    choices = ["v9", "v11", "v12", "v13", "v14"];
  }

  const filtered = choices.filter((choice) =>
    choice.startsWith(focusedOption.value)
  );

  await interaction.respond(
    filtered.map((choice) => ({ name: choice, value: choice }))
  );
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const option = interaction.options.getString("option")!;

  if (option === "shop") {
    const embed = {
      title: "Shop",
      description: "Buy stuff to make more money!",
      fields: shops.map((shop) => ({
        name: shop.name,
        value: `Price: ${shop.price}\nIncome Per Second: ${shop.incomePerSecond}`,
      })),
    };

    await interaction.reply({ embeds: [embed] });
  }
}