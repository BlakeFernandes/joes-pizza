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
        const missingAmount = BigInt(amount) - user.wallet;
        throw new Error(`Insufficient funds. You need ${Math.round(Number(missingAmount))} more coins.`);
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

async function getBalance(userId: string): Promise<BigInt> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error("User not found.");
    }

    return user.wallet;
}

async function getTopBalances(limit: number = 10) {
    const users = await prisma.user.findMany({
        include: {
            Bank: true,
        },
        take: limit * 2,
    });

    // const sortedUsers = users.sort((a, b) => {
    //     const aBankBalance = a.Bank.length > 0 ? a.Bank[0].balance : BigInt(0);
    //     const bBankBalance = b.Bank.length > 0 ? b.Bank[0].balance : BigInt(0);

    //     return b.wallet + bBankBalance - (a.wallet + aBankBalance);
    // });

    return users;
}

async function getLevel(userId: string): Promise<BigInt> {
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
