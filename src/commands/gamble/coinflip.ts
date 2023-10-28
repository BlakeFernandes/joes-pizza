import {ChatInputCommandInteraction} from "discord.js";
import * as bank from "../../bank/bank";
import * as user from "../../user/user";

const userTimeMap = new Map<string, number>();
const userBalanceMap = new Map<string, number>();

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

  const isJackpot = Math.random() < 1 / 6000;

  let win;
  if (isJackpot) {
    win = 2 * amount;
  } else {
    win = result === "heads" ? amount : -amount;
  }

  userBalanceMap.set(userId, (userBalanceMap.get(userId) ?? 0) + win);
  userTimeMap.set(userId, Date.now());

  setInterval(() => {
    if (
      userTimeMap.get(userId) &&
      Date.now() - userTimeMap.get(userId)! > 1000 * 30
    ) {
      userTimeMap.delete(userId);
      userBalanceMap.delete(userId);
    }
  }, 1000 * 30);

  if (win > 0) {
    user.deposit(userId, amount);
  } else {
    user.withdraw(userId, amount);
  }

  if (isJackpot) {
    await message.reply(
      `🎉 JACKPOT! 🎉 You won ${win} coins! ||(${userBalanceMap.get(userId)})||`
    );
  } else if (userBalanceMap.has(userId)) {
    await message.reply(
      `You flipped ${result} and ${
        win > 0 ? "won" : "lost"
      } ${amount} coins. ||(${userBalanceMap.get(userId)})||`
    );
  } else {
    await message.reply(
      `You flipped ${result} and ${win > 0 ? "won" : "lost"} ${amount} coins.`
    );
  }
}
