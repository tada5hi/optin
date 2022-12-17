/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { FlattenObject, ObjectLiteral } from '../type';
import { hasOwnProperty } from './has-property';

export function setNestedProperty<
    O extends ObjectLiteral,
    K extends keyof FlattenObject<O>,
>(record: O, key: K, value: FlattenObject<O>[K]) {
    const parts = key.split('.');
    if (parts.length === 1) {
        record[key] = value;
        return;
    }

    const prefix = parts.shift() as (keyof O);

    if (!Object.prototype.hasOwnProperty.call(record, prefix)) {
        record[prefix] = {} as O[keyof 0];
    }

    setNestedProperty(record[prefix], parts.join('.') as any, value as any);
}

export function hasNestedProperty<
    O extends ObjectLiteral,
    K extends keyof FlattenObject<O>,
>(record: O, key: K) : boolean {
    const parts = key.split('.');
    if (parts.length === 1) {
        return hasOwnProperty(record, key);
    }

    const prefix = parts.shift();

    if (!hasOwnProperty(record, prefix)) {
        return false;
    }

    return hasNestedProperty(record[prefix], parts.join('.'));
}

export function removeNestedProperty<
    O extends ObjectLiteral,
    K extends keyof FlattenObject<O>,
>(record: O, key: K) {
    const parts = key.split('.');
    if (parts.length === 1) {
        if (hasOwnProperty(record, key)) {
            delete record[key];
        }

        return;
    }

    const prefix = parts.shift();

    if (!hasOwnProperty(record, prefix)) {
        return;
    }

    removeNestedProperty(record[prefix], parts.join('.'));
}

export function getNestedProperty<
    O extends ObjectLiteral,
    K extends keyof FlattenObject<O>,
>(record: O, key: K) : FlattenObject<O>[K] {
    const parts = key.split('.');
    if (parts.length === 1) {
        return record[key];
    }

    const prefix = parts.shift();

    if (!hasOwnProperty(record, prefix)) {
        return undefined;
    }

    return getNestedProperty(record[prefix], parts.join('.'));
}
