import BigNumber from "bignumber.js";

export function formatNumber(number: BigNumber): string {
    return number.toFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toBigNumber(value: string | number | BigNumber | String): BigNumber {
    if (value instanceof String) {
        return new BigNumber(value.toString());
    }
    return new BigNumber(value);
}

export function toPrismaString(value: BigNumber): string {
    return value.toString();
}
