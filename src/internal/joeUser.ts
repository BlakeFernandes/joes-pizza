import { prisma } from "~/index";

async function hasMoney(userId: string, amount: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return false;
  }

  return user.wallet >= amount;
}

async function create(userId: string): Promise<void> {
  await prisma.user.upsert({
    where: {
      id: userId,
    },
    update: {},
    create: {
      id: userId,
    },
  });
}

async function deposit(userId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new Error("Deposit amount should be greater than 0.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      wallet: {
        increment: amount,
      },
    },
  });
}

async function withdraw(userId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new Error("Withdraw amount should be greater than 0.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user.wallet < amount) {
    const missingAmount = amount - user.wallet;
    throw new Error(
      `Insufficient funds. You need ${Math.round(missingAmount)} more coins.`
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      wallet: {
        decrement: amount,
      },
    },
  });
}

async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found.");
  }

  return user.wallet;
}

async function getTopBalances(
  limit: number = 10
) {
  return prisma.user.findMany({
    orderBy: {
      wallet: "desc",
    },
    take: limit,
    select: {
      id: true,
      wallet: true,
      level: true,
    },
  });
}

export default {
  hasMoney,
  create,
  deposit,
  withdraw,
  getBalance,
  getTopBalances,
};
