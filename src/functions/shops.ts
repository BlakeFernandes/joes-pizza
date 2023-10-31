export type ShopData = {
    id: number;
    name: string;
    price: number;
    priceExponent: number;
    incomePerSecond: number;
};

export const shops: ShopData[] = [
    {
        id: 1,
        name: "🍋 Little Timmy's Lemonade Stand",
        price: 5000,
        priceExponent: 1.15,
        incomePerSecond: 15,
    },
    {
        id: 2,
        name: "🌭 Bunnings Sausage Sizzle",
        price: 80000,
        priceExponent: 1.25,
        incomePerSecond: 50,
    },
    {
        id: 3,
        name: "🍦 Mr Whippys",
        price: 400000,
        priceExponent: 1.3,
        incomePerSecond: 400,
    },
    {
        id: 4,
        name: "🍔 Maccas",
        price: 2000000,
        priceExponent: 1.35,
        incomePerSecond: 1_500,
    },
    {
        id: 5,
        name: "🍩 Dunkin' Donuts",
        price: 5000000,
        priceExponent: 1.4,
        incomePerSecond: 3_750,
    },
    {
        id: 6,
        name: "🏪 Muhammad's Diary",
        price: 15000000,
        priceExponent: 1.45,
        incomePerSecond: 10_000,
    },
    {
        id: 7,
        name: "🎬 Hoyts",
        price: 40000000,
        priceExponent: 1.5,
        incomePerSecond: 25_000,
    },
    {
        id: 8,
        name: "✈️ Al-Qaeda Airline",
        price: 90000000,
        priceExponent: 1.55,
        incomePerSecond: 50_000,
    },
    {
        id: 9,
        name: "🚀 Daddy Musk's Spaceships",
        price: 200000000,
        priceExponent: 1.6,
        incomePerSecond: 125_000,
    },
    {
        id: 10,
        name: "🍕 Joe's Pizza",
        price: 500000000,
        priceExponent: 1.65,
        incomePerSecond: 250_000,
    },
];
