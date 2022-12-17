/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { OptionMissError } from './error';
import {
    getNestedProperty,
    hasNestedProperty, hasOwnProperty, isValidatorResult, removeNestedProperty, setNestedProperty,
} from './utils';
import {
    Context, FlattenObject,
    ObjectLiteral,
    Transformer,
    Transformers,
    Validators,
} from './type';

export class Opticon<
    O extends ObjectLiteral,
    I extends { [K in keyof O]?: any } = { [K in keyof O]?: any },
> {
    protected options : Partial<O>;

    protected defaults: Partial<O>;

    protected transformers: Transformers<O>;

    protected validators : Validators<O>;

    protected errorOnMiss: boolean;

    // -------------------------------------------------

    constructor(context?: Context<O>) {
        context = context || {};

        this.options = context.options || {};
        this.defaults = context.defaults || {};
        this.transformers = context.transformers || {};
        this.validators = context.validators || {};

        this.errorOnMiss = context.errorOnMiss ?? false;
    }

    // -------------------------------------------------

    set(value: Partial<FlattenObject<O>>) : this;

    set<K extends keyof FlattenObject<O>>(key: K, value: FlattenObject<O>[K]) : this;

    set<K extends keyof FlattenObject<O>>(key: K | Partial<FlattenObject<O>>, value?: FlattenObject<O>[K]) : this {
        if (typeof key === 'object') {
            const keys = Object.keys(key) as (keyof FlattenObject<O>)[];
            for (let i = 0; i < keys.length; i++) {
                this.set(keys[i], key[keys[i]]);
            }

            return this;
        }

        const validator = this.validators[key];
        if (validator) {
            try {
                const output = validator(value);

                if (isValidatorResult<O[K]>(output)) {
                    if (output.success) {
                        setNestedProperty(this.options, key as any, output.data);
                    }
                }

                if (typeof output === 'boolean' && output) {
                    setNestedProperty(this.options, key as any, value);
                }
            } catch (e) {
                // do nothing
            }

            return this;
        }

        setNestedProperty(this.options, key as any, value);

        return this;
    }

    setRaw(value: Partial<FlattenObject<I>>) : this;

    setRaw<K extends keyof FlattenObject<I>>(key: K, value: FlattenObject<I>[K]) : this;

    setRaw<K extends keyof FlattenObject<I>>(key: K | FlattenObject<I>, value?: FlattenObject<I>[K]) : this {
        if (typeof key === 'object') {
            const keys = Object.keys(key) as (keyof FlattenObject<I>)[];
            for (let i = 0; i < keys.length; i++) {
                this.setRaw(keys[i], key[keys[i]]);
            }

            return this;
        }

        if (hasOwnProperty(this.transformers, key)) {
            this.set(key as any, (this.transformers[key] as Transformer<O[K]>)(value));

            return this;
        }

        if (hasOwnProperty(this.validators, key)) {
            this.set(key as any, value as unknown as O[K]);
        }

        return this;
    }

    has(key: keyof FlattenObject<O>) : boolean {
        return hasNestedProperty(this.options, key as any);
    }

    // ----------------------------------------------

    reset() : this;

    reset(key: keyof FlattenObject<O>) : this;

    reset(keys: (keyof FlattenObject<O>)[]) : this;

    reset(key?: (keyof FlattenObject<O>) | (keyof FlattenObject<O>)[]) : this {
        if (typeof key === 'undefined') {
            this.options = {};
            return this;
        }

        if (Array.isArray(key)) {
            for (let i = 0; i < key.length; i++) {
                this.reset(key[i]);
            }

            return this;
        }

        removeNestedProperty(this.options, key as any);

        return this;
    }

    // ----------------------------------------------

    get() : O;

    get<K extends keyof FlattenObject<O>>(key: K) : FlattenObject<O>[K];

    get<K extends keyof FlattenObject<O>>(key?: K) : any {
        if (typeof key === 'undefined') {
            const keys = [
                ...new Set([
                    ...Object.keys(this.defaults),
                    ...Object.keys(this.options),
                ]),
            ] as (keyof FlattenObject<O>)[];

            const options : Record<string, any> = {};

            for (let i = 0; i < keys.length; i++) {
                options[keys[i]] = this.get(keys[i]);
            }

            return options as O;
        }

        if (hasNestedProperty(this.options, key as any)) {
            return getNestedProperty(this.options, key as any) as O[K];
        }

        if (hasNestedProperty(this.defaults, key as any)) {
            return getNestedProperty(this.defaults, key as any) as O[K];
        }

        if (this.errorOnMiss) {
            throw new OptionMissError(key as string);
        }

        return undefined;
    }

    // ----------------------------------------------

    setDefault(value: Partial<FlattenObject<O>>) : this;

    setDefault<K extends keyof FlattenObject<O>>(key: K, value: FlattenObject<O>[K]) : this;

    setDefault<K extends keyof FlattenObject<O>>(key: (keyof O) | Partial<FlattenObject<O>>, value?: FlattenObject<O>[K]) : this {
        if (typeof key === 'object') {
            const keys = Object.keys(key) as (keyof FlattenObject<O>)[];
            for (let i = 0; i < keys.length; i++) {
                this.setDefault(keys[i], key[keys[i]]);
            }

            return this;
        }

        setNestedProperty(this.defaults, key as any, value);

        return this;
    }

    hasDefault(key: keyof FlattenObject<O>) : boolean {
        return hasNestedProperty(this.defaults, key as any);
    }

    resetDefault() : this;

    resetDefault(key: keyof FlattenObject<O>) : this;

    resetDefault(keys: (keyof FlattenObject<O>)[]) : this;

    resetDefault(key?: (keyof FlattenObject<O>) | (keyof FlattenObject<O>)[]) : this {
        if (typeof key === 'undefined') {
            this.defaults = {};
            return this;
        }

        if (Array.isArray(key)) {
            for (let i = 0; i < key.length; i++) {
                this.resetDefault(key[i]);
            }

            return this;
        }

        removeNestedProperty(this.defaults, key as any);

        return this;
    }

    getDefault() : O;

    getDefault<K extends keyof FlattenObject<O>>(key?: K) : FlattenObject<O>[K];

    getDefault<K extends keyof FlattenObject<O>>(key?: K) : any {
        if (typeof key === 'undefined') {
            return this.defaults;
        }

        return getNestedProperty(this.defaults, key as any);
    }
}