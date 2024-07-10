import { prisma } from "~/index";
import BigNumber from "bignumber.js";
import { toBigNumber, toPrismaString } from "~/functions/numberUtils";

async function getUserBanks(params: { userId: string }) {
    return prisma.bank.findMany({
        where: {
            ownerId: params.userId,
        },
    });
}

async function deposit(params: { userId: string; bankId: number; amount: BigNumber }) {
    const bank = await prisma.bank.findUnique({
        where: {
            bankId_ownerId: {
                ownerId: params.userId,
                bankId: params.bankId,
            },
        },
    });

    if (!bank) {
        throw new Error("Bank account not found.");
    }

    const newBalance = toBigNumber(bank.balance).plus(params.amount);

    return prisma.bank.update({
        where: {
            bankId_ownerId: {
                ownerId: params.userId,
                bankId: params.bankId,
            },
        },
        data: {
            balance: toPrismaString(newBalance),
        },
    });
}
async function withdraw(params: { userId: string; bankId: number; amount: BigNumber }) {
    const bank = await prisma.bank.findUnique({
        where: {
            bankId_ownerId: {
                ownerId: params.userId,
                bankId: params.bankId,
            },
        },
    });

    if (!bank) {
        throw new Error("Bank account not found.");
    }

    const currentBalance = toBigNumber(bank.balance);
    if (currentBalance.lt(params.amount)) {
        throw new Error("Insufficient funds.");
    }

    const newBalance = currentBalance.minus(params.amount);

    return prisma.bank.update({
        where: {
            bankId_ownerId: {
                ownerId: params.userId,
                bankId: params.bankId,
            },
        },
        data: {
            balance: toPrismaString(newBalance),
        },
    });
}

async function join(params: { userId: string; bankId: number }) {
    return prisma.bank.create({
        data: {
            ownerId: params.userId,
            bankId: params.bankId,
            balance: toPrismaString(toBigNumber(0)),
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
    return toBigNumber(bank?.balance ?? 0);
}

export default {
    getUserBanks,
    deposit,
    withdraw,
    join,
    getBalance,
};
