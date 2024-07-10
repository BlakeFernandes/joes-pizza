import { prisma } from "~/index";
import BigNumber from "bignumber.js";
import { toBigNumber, toPrismaString } from "~/functions/numberUtils";

async function hasMoney(userId: string, amount: BigNumber): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        return false;
    }

    return toBigNumber(user.wallet).gte(amount);
}

async function create(userId: string): Promise<void> {
    await prisma.user.upsert({
        where: {
            id: userId,
        },
        update: {},
        create: {
            id: userId,
            wallet: toPrismaString(new BigNumber(100)),
        },
    });
}

async function deposit(userId: string, amount: BigNumber): Promise<void> {
    if (amount.lte(0)) {
        throw new Error("Deposit amount should be greater than 0.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error("User not found.");
    }

    const newBalance = toBigNumber(user.wallet).plus(amount);

    await prisma.user.update({
        where: { id: userId },
        data: {
            wallet: newBalance.toFixed(),
        },
    });
}

async function withdraw(userId: string, amount: BigNumber): Promise<void> {
    if (amount.lte(0)) {
        throw new Error("Withdraw amount should be greater than 0.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error("User not found.");
    }

    const userWallet = toBigNumber(user.wallet);

    if (userWallet.lt(amount)) {
        const missingAmount = amount.minus(userWallet);
        throw new Error(`Insufficient funds. You need ${missingAmount.toFixed()} more coins.`);
    }

    const newBalance = userWallet.minus(amount);

    await prisma.user.update({
        where: { id: userId },
        data: {
            wallet: newBalance.toFixed(),
        },
    });
}

async function getBalance(userId: string): Promise<BigNumber> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error("User not found.");
    }

    return toBigNumber(user.wallet);
}

async function getTopBalances(limit: number = 10) {
    const users = await prisma.user.findMany({
        include: {
            Bank: true,
        },
        take: limit * 2,
    });

    const sortedUsers = users.sort((a: any, b: any) => {
        const aBankBalance = a.Bank.length > 0 ? toBigNumber(a.Bank[0].balance) : toBigNumber(0);
        const bBankBalance = b.Bank.length > 0 ? toBigNumber(b.Bank[0].balance) : toBigNumber(0);

        return b.wallet.plus(bBankBalance).minus(a.wallet.plus(aBankBalance)).toNumber();
    });

    return sortedUsers.slice(0, limit);
}

async function getLevel(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error("User not found.");
    }

    return user.level;
}

async function addLevel(userId: string, amount: number): Promise<void> {
    if (amount <= 0) {
        throw new Error("Level amount should be greater than 0.");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            level: {
                increment: amount,
            },
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
    getLevel,
    addLevel,
};
