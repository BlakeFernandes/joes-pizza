import { ChatInputCommandInteraction } from "discord.js";
import * as bank from "../../bank/bank";
import * as user from "../../user/user";

export async function coinFlip(
  message: ChatInputCommandInteraction,
  userId: string,
  amount: number
) {
  const hasMoney = await user.hasMoney(userId, amount);

  if (!hasMoney) {
    await message.reply("Insufficient funds.");
    return;
  }

  let result = Math.random() < 0.5 ? "heads" : "tails";
  
  if (userId === "1167645797366648882") {
    result = Math.random() > 0.5 ? "heads" : "tails";
  }

  const win = result === "heads" ? amount : -amount;

  if (win > 0) {
    user.deposit(userId, amount);
  } else {
    user.withdraw(userId, amount);
  }

  await message.reply(`You flipped ${result} and ${win > 0 ? "won" : "lost"} ${amount} coins.`)
}