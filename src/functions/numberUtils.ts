export function formatNumber(number: number): string {
    const roundedNumber = Math.round(number);
    return roundedNumber.toLocaleString();
}

export function formatBigInt(number: BigInt): string {
    const roundedNumber = Number(number);
    return roundedNumber.toLocaleString();
}
