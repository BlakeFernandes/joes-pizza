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
        price: 200,
        priceExponent: 1.15,
        incomePerSecond: 1,
    },
    {
        id: 2,
        name: "🌭 Bunnings Sausage Sizzle",
        price: 1_500,
        priceExponent: 1.25,
        incomePerSecond: 5,
    },
    {
        id: 3,
        name: "🍦 Mr Whippys",
        price: 10_000,
        priceExponent: 1.3,
        incomePerSecond: 20,
    },
    {
        id: 4,
        name: "🍔 Maccas",
        price: 50_000,
        priceExponent: 1.35,
        incomePerSecond: 80,
    },
    {
        id: 5,
        name: "🍩 Dunkin' Donuts",
        price: 200_000,
        priceExponent: 1.4,
        incomePerSecond: 320,
    },
    {
        id: 6,
        name: "🏪 Muhammad's Diary",
        price: 700_000,
        priceExponent: 1.45,
        incomePerSecond: 1_280,
    },
    {
        id: 7,
        name: "🎬 Hoyts",
        price: 2_500_000,
        priceExponent: 1.5,
        incomePerSecond: 5_120,
    },
    {
        id: 8,
        name: "✈️ Al-Qaeda Airline",
        price: 9_000_000,
        priceExponent: 1.55,
        incomePerSecond: 20_480,
    },
    {
        id: 9,
        name: "🚀 Daddy Musk's Spaceships",
        price: 32_000_000,
        priceExponent: 1.6,
        incomePerSecond: 81_920,
    },
    {
        id: 10,
        name: "🍕 Joe's Pizza",
        price: 500_000_000,
        priceExponent: 1.65,
        incomePerSecond: 327_680,
    },
];
