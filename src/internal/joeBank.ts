import { prisma } from "~/index";

async function getUserBanks(params: {
    userId: string;
}) {
    return prisma.bank.findMany({
        where: {
            ownerId: params.userId
        }
    })
}

async function deposit(params: {
  userId: string;
  bankName: string;
  amount: number;
}) {
  return prisma.bank.update({
    where: {
      name_ownerId: {
        ownerId: params.userId,
        name: params.bankName,
      },
    },
    data: {
      balance: {
        increment: params.amount,
      },
    },
  });
};

async function withdraw(params: {
  userId: string;
  bankName: string;
  amount: number;
}) {
  return prisma.bank.update({
    where: {
      name_ownerId: {
        ownerId: params.userId,
        name: params.bankName,
      },
    },
    data: {
      balance: {
        decrement: params.amount,
      },
    },
  });
};

export default {
  getUserBanks,
  deposit,
  withdraw,
}