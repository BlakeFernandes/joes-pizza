// src/functions/autoBuy.ts

import { ShopData } from "~/slashCommands/shop";

interface PurchaseSummary {
    shopName: string;
    count: number;
    totalSpent: number;
}

function autoBuy(budget: number, shops: ShopData[]): PurchaseSummary[] {
    const sortedShops = [...shops].sort((a, b) => b.incomePerSecond - a.incomePerSecond);
    const purchaseSummary: PurchaseSummary[] = [];

    for (const shop of sortedShops) {
        let amountOwned = 0;
        let price = shop.price;

        while (budget >= price) {
            budget -= price;
            amountOwned += 1;
            price = shop.price * Math.pow(shop.priceExponent, amountOwned);
        }

        if (amountOwned > 0) {
            purchaseSummary.push({
                shopName: shop.name,
                count: amountOwned,
                totalSpent: amountOwned * shop.price,
            });
        }
    }

    return purchaseSummary;
}

export default autoBuy;
