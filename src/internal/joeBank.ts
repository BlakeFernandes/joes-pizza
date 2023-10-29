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

async function deposit(params: { userId: string; bankId: number; amount: number }) {
    return prisma.bank.update({
        where: {
            bankId_ownerId: {
                ownerId: params.userId,
                bankId: params.bankId,
            },
        },
        data: {
            balance: {
                increment: params.amount,
            },
        },
    });
};

async function withdraw(params: { userId: string; bankId: number; amount: number }) {
    return prisma.bank.update({
        where: {
            bankId_ownerId: {
                ownerId: params.userId,
                bankId: params.bankId,
            },
        },
        data: {
            balance: {
                decrement: params.amount,
            },
        },
    });
};

async function join(params: { userId: string; bankId: number }) {
    return prisma.bank.create({
        data: {
            ownerId: params.userId,
            bankId: params.bankId,
            balance: 0,
        },
    });
}

async function getBalance(params: { userId: string; bankId: number }) {
    const bank = await prisma.bank.findUnique({
        where: {
            bankId_ownerId: {
                ownerId: params.userId,
                bankId: params.bankId,
            },
        },
    });
    return bank?.balance ?? 0;
}

export default {
  getUserBanks,
  deposit,
  withdraw,
  join,
  getBalance
}