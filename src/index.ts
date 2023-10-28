import {PrismaClient} from "@prisma/client";
import {Events, REST, Routes, userMention} from "discord.js";
import {Client, GatewayIntentBits} from "discord.js";
import {config} from "dotenv";

import {
  create,
  getBalance,
  deposit,
  withdraw,
  hasMoney,
  getTopBalances,
} from "./user/user";
import {coinFlip} from "./commands/gamble/coinflip";
import {execute, shops} from "./commands/shop/shop";

export const prisma = new PrismaClient();

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "coinflip",
    description: "Flips a coin.",
    options: [
      {
        name: "amount",
        description: "The amount of coins to gamble.",
        type: 4,
        required: true,
      },
    ],
  },
  {
    name: "balance",
    description: "Shows your balance.",
  },
  {
    name: "give",
    description: "Gives someone coins.",
    options: [
      {
        name: "user",
        description: "The user to give coins to.",
        type: 6,
        required: true,
      },
      {
        name: "amount",
        description: "The amount of coins to give.",
        type: 4,
        required: true,
      },
    ],
  },
  {
    name: "baltop",
    description: "Shows the richest users.",
  },
  {
    name: "shop",
    description: "Shows the shop.",
    options: [
      {
        name: "option",
        description: "The option to select.",
        type: 3,
        required: true,
        choices: [
          {
            name: "shop",
            value: "shop",
          },
          {
            name: "buy",
            value: "buy",
          },
          {
            name: "stats",
            value: "stats",
          },
        ],
      },
      {
        name: "type",
        description: "The type of item to buy.",
        type: 3,
        required: false,
        choices: [
          {
            name: "Lemonade Stand",
            value: "Lemonade Stand",
          },
          {
            name: "Bunnings Sausage Sizzle",
            value: "Bunnings Sausage Sizzle",
          },
        ],
      },
    ],
  },
];

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (!interaction.isChatInputCommand()) return;

    await create(interaction.user.id);

    if (interaction.commandName === "ping") {
      await interaction.reply("Pong!");
    }

    if (interaction.commandName === "coinflip") {
      const amount = interaction.options.getInteger("amount")!;
      await coinFlip(interaction, interaction.user.id, amount);
    }

    if (interaction.commandName === "balance") {
      const balance = await getBalance(interaction.user.id);
      const roundedBalance = Math.round(balance);

      await interaction.reply(`Your balance is ${roundedBalance} coins.`);
    }

    if (interaction.commandName === "baltop") {
      const topUsers = await getTopBalances();
      let response = "**Top Users by Balance:**\n";

      topUsers.forEach((user, index) => {
        const roundedBalance = Math.round(user.wallet);
        response += `${index + 1}. <@${user.id}>: ${roundedBalance} coins\n`;
      });

      await interaction.reply(response);
    }

    if (interaction.commandName === "shop") {
      await execute(interaction);
    }

    if (interaction.commandName === "give") {
      const user = interaction.options.getUser("user")!;
      const amount = interaction.options.getInteger("amount")!;

      if (await hasMoney(interaction.user.id, amount)) {
        await withdraw(interaction.user.id, amount);
        await deposit(user.id, amount);

        await interaction.reply(
          `You gave ${userMention(user.id)} ${amount} coins.`
        );
      } else {
        await interaction.reply("Insufficient funds.");
        return;
      }
    }
  } else if (interaction.isAutocomplete()) {
    // const command = interaction.client.commands.get(interaction.commandName);
    // if (!command) {
    //   console.error(
    //     `No command matching ${interaction.commandName} was found.`
    //   );
    //   return;
    // }
    // try {
    //   await command.autocomplete(interaction);
    // } catch (error) {
    //   console.error(error);
    // }
  }
});

(async () => {
  client.login(process.env.TOKEN!);
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);
  
  setInterval(async () => {
    const userShops = await prisma.shop.findMany();
    userShops.forEach(async (userShop) => {
      const user = userShop.ownerId;
      const amountOwned = userShop.amountOwned;
      const incomePerSecond = shops.filter((shop2) => shop2.id === userShop.shopId)[0].incomePerSecond;

      const out = amountOwned * incomePerSecond;

      if (out > 0) {
        await deposit(user, out);
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
    })
  }, 1000)

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
