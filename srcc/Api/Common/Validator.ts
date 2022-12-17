import _ from 'lodash';
import { Func, FuncParams } from 'ts-util-types';
import validator from 'validator';
import * as AppError from '../error';

// TODO: Use an advanced better inference and not any
export function call(req: any, ...functions: ((value: any) => any)[]) {
    let value: any = req;

    for (let i = 0; i < functions.length; i++) {
        value = functions[i](value);
    }
    return value;
}

export function obtain(key: string) {
    return (parentValue: any) => {
        return _.get(parentValue, key);
    };
}

const nameRegExp = /[\w ]+/;
export function isName(errCode: string) {
    return (value: unknown) => {
        if (_.isString(value) && nameRegExp.test(value)) return value;
        throw new AppError.Validation(errCode);
    };
}

export function cleanName() {
    return (value: string) => {
        return value
            .split(' ')
            .map((str) => str.trim())
            .join(' ');
    };
}

export function isPhone(errCode: string) {
    return function (value: unknown) {
        if (_.isString(value) && validator.isMobilePhone(value)) return value;
        throw new AppError.Validation(errCode);
    };
}

export function isEmail(errCode: string) {
    return function (value: unknown) {
        if (_.isString(value) && validator.isEmail(value)) return value;
        throw new AppError.Validation(errCode);
    };
}

export function isAlphaNumeric(errCode: string) {
    return function (value: unknown) {
        if (_.isString(value) && validator.isAlphanumeric(value)) return value;
        throw new AppError.Validation(errCode);
    };
}

export function isLenRange(range: { min?: number; max?: number }, errCode: string) {
    return function (value: any) {
        if (
            (range.min == null || value?.length >= range.min) &&
            (range.max == null || value?.length <= range.max)
        )
            return value;
        throw new AppError.Validation(errCode);
    };
}

export function isString(errCode: string) {
    return function (value: unknown) {
        if (_.isString(value)) return value;
        throw new AppError.Validation(errCode);
    };
}

export function isOptional<T extends (...args: any[]) => (value: any) => any>(
    innerFunc: T,
    ...args: FuncParams<T>
) {
    return (value: any) => {
        if (value == null) return value;
        return innerFunc(...args)(value);
    };
}

export function isBooleanLikeString(errCode: string) {
    return (value: any) => {
        if (value === 'true' || value === 'false') return value;
        throw new AppError.Validation(errCode);
    };
}

export function obtainBooleanFromLikeString() {
    return (value: any) => {
        return value === 'true';
    };
}

export function setDefault(defaultValue: any) {
    return (value: any) => (value == null ? defaultValue : value);
}

const rawTokenFormat = /^Bearer [\w\.\-\_]+$/;
export function isRawToken(errCode: string) {
    return (value: any) => {
        if (rawTokenFormat.test(value)) return value;
        throw new AppError.Validation(errCode);
    };
}

export function obtainToken() {
    return (value: any) => {
        return value.split(' ')[1];
    };
}
