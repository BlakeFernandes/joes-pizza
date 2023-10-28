import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import {prisma} from "../../index";
import {getBalance, withdraw} from "../../user/user";

export const shopCommand = new SlashCommandBuilder()
  .setName("shop")
  .setDescription("View Shops")
  .addStringOption((option) =>
    option
      .setName("option")
      .setDescription("Option to execute")
      .setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Select the shop type")
      .setAutocomplete(true)
      .setRequired(false)
  );

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
    name: "Lemonade Stand",
    price: 1000,
    priceExponent: 1.15,
    incomePerSecond: 1,
  },
  {
    id: 2,
    name: "Bunnings Sausage Sizzle",
    price: 50_000,
    priceExponent: 1.5,
    incomePerSecond: 10,
  },
];

export async function autocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  let choices;

  if (focusedOption.name === "option") {
    choices = ["shop", "buy", "stats"];
  }

  if (focusedOption.name === "type") {
    choices = shops.forEach((shop) => shop.name);
  }

  const filtered = choices.filter((choice) =>
    choice.startsWith(focusedOption.value)
  );

  await interaction.respond(
    filtered.map((choice) => ({name: choice, value: choice}))
  );
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const option = interaction.options.getString("option")!;

  const userShops = await prisma.shop.findMany({
    where: {
      ownerId: interaction.user.id,
    },
  });

  if (option === "shop") {
    const embed = new EmbedBuilder()
      .setTitle("Shop")
      .setDescription("Buy stuff to make more money!");

    for (const shop of shops) {
      const userShop = userShops.filter(
        (userShop) => userShop.shopId === shop.id
      )[0];
      const price =
        shop.price * Math.pow(shop.priceExponent, userShop?.amountOwned ?? 1);
      const incomePerSecond =
        shop.incomePerSecond * (userShop?.amountOwned ?? 0);

      embed.addFields({
        name: shop.name,
        value: `Price: $${price} ($${shop.price} @ x${shop.priceExponent}) 
        Income Per Second: $${incomePerSecond} ($${shop.incomePerSecond})
        Owned: ${userShop?.amountOwned ?? 0}
        Profit: $${userShop?.profit ?? 0}`,
      });
    }

    await interaction.reply({embeds: [embed]});
  }

  if (option === "buy") {
    const type = interaction.options.getString("type")!;

    const shop = shops.filter((shop) => shop.name === type)[0];

    if (!type || !shop) {
      await interaction.reply("Invalid shop type.");
      return;
    }

    const userShop = userShops.filter((userShop) => userShop.shopId === shop.id)[0];
    const amountOwned = userShop?.amountOwned ?? 0;

    const price = Math.round(shop.price * Math.pow(shop.priceExponent, amountOwned));
    const currentBalance = await getBalance(interaction.user.id);

    if (price > currentBalance) {
      const missingAmount = price - currentBalance;
      await interaction.reply(
        `Insufficient funds. You need $${Math.round(missingAmount)} more to buy ${shop.name}.`
      );
      return;
    }

    withdraw(interaction.user.id, price);

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
        amountOwned: 1,
      },
    });

    await interaction.reply(`You bought a ${shop.name} for $${Math.round(price)}.`);
  }
}
