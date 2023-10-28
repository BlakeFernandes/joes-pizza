import {prisma} from "..";

export async function hasMoney(
  userId: string,
  amount: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({where: {id: userId}});

  if (!user) {
    return false;
  }

  return user.wallet >= amount;
}

export async function create(userId: string): Promise<void> {
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

export async function deposit(userId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new Error("Deposit amount should be greater than 0.");
  }

  await prisma.user.update({
    where: {id: userId},
    data: {
      wallet: {
        increment: amount,
      },
    },
  });
}

export async function withdraw(userId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new Error("Withdraw amount should be greater than 0.");
  }

  const user = await prisma.user.findUnique({where: {id: userId}});

  if (user.wallet < amount) {
    const missingAmount = amount - user.wallet;
    throw new Error(`Insufficient funds. You need ${missingAmount} more coins.`);
  }

  await prisma.user.update({
    where: {id: userId},
    data: {
      wallet: {
        decrement: amount,
      },
    },
  });
}

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({where: {id: userId}});

  if (!user) {
    throw new Error("User not found.");
  }

  return user.wallet;
}

export async function getTopBalances(
  limit: number = 10
): Promise<{id: string; wallet: number}[]> {
  return prisma.user.findMany({
    orderBy: {
      wallet: "desc",
    },
    take: limit,
    select: {
      id: true,
      wallet: true,
    },
  });
}
