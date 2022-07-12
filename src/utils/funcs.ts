import * as crypto from "crypto";
import { clamp, forEach } from "lodash";

const DEFAULT_ONE_TIME_PWD_LEN = 8;

export const generateOneTimePwd = async (length = DEFAULT_ONE_TIME_PWD_LEN) => {
    const tokenBtye = await crypto.randomBytes((length + 1) >> 1);
    const tokenStr = tokenBtye.toString("hex").slice(0, length);
    return tokenStr;
};

export const convertObjToArrIfNotArr = <T extends string | number | boolean>(
    obj?: T | T[]
): T[] => {
    if (Array.isArray(obj)) return obj;
    if (obj == null) return [];
    return [obj];
};

export const clampNumWithMinDefault = (num: number | undefined, min: number, max: number) => {
    return clamp(num || min, min, max);
};

export const returnUndefinedIfFalsy = <T extends unknown>(obj: T) => {
    if (!!obj === false) return undefined;
    return obj;
};

export const returnFalseIfNully = <T extends unknown>(
    obj: T
): Exclude<T, null | undefined> | false => {
    if (obj == null) return false;
    return obj as Exclude<T, null | undefined>;
};

export const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export function convertStrToRegExpStr(str: string) {
    if (str === "*") return ".*";
    return str.replace(/[\\[.+*?(){|^$]/g, "\\$&");
}

export function getOrOneOfRegExpStr(...regExpStrs: string[]) {
    let orOneOfRegExpStr = "";
    for (let i = 0; i < regExpStrs.length; i++) {
        orOneOfRegExpStr += "(" + regExpStrs[i] + ")|";
    }
    return orOneOfRegExpStr.slice(0, -1); // remove '|'
}
