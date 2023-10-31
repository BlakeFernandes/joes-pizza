export function formatNumber(number: number): string {
    const roundedNumber = Math.round(number);
    return roundedNumber.toLocaleString();
}
