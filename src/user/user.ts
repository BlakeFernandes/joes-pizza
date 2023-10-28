import { prisma } from "..";

export async function hasMoney(userId: string, amount: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

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
      id: userId
    },
  });
}

export async function deposit(userId: string, amount: number): Promise<void> {
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

export async function withdraw(userId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new Error("Withdraw amount should be greater than 0.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user && user.wallet < amount) {
    throw new Error("Insufficient funds.");
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

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found.");
  }

  return user.wallet;
}