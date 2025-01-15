/**
 * Module providing synchronization classes and functions.
 */

'use strict';

/**
 * A DeferredPromise is a Promise that can be explicitely settled by a caller.
 * It exposes the same functions than a Promise.
 * From: https://stackoverflow.com/questions/26150232/how-can-i-access-promise-resolution-callbacks-outside-the-promise-constructor-ca
 */
class DeferredPromise {
    #promise;
    
    constructor() {
        this.#promise = new Promise((resolve, reject) => {
            // Assign the resolve and reject functions to `this`
            // making them usable on the class instance
            this.resolve = resolve;
            this.reject = reject;
        });
        // Bind "then", "catch", and "finally" to implement the same interface as Promise
        this.then = this.#promise.then.bind(this.#promise);
        this.catch = this.#promise.catch.bind(this.#promise);
        this.finally = this.#promise.finally.bind(this.#promise);
        this[Symbol.toStringTag] = 'Promise';
    }
}

/**
 * A Barrier object encapsulates a fixed number of promises that can be
 * externally resolved.
 * It exposes similar static functions (but not all) than a Promise.
 */
class Barrier {
    length;
    #promises = [];
    #resolveFunctions;
    
    /**
     * Construct a Barrier with the specified number of Promises.
     * @param {number} length Number of promises
     */
    constructor(length) {
        if (length !== 0 && !length || length < 0) {
            throw new RangeError("Invalid length");
        }
        this.length = length;
        this.#resolveFunctions = Array.from({length}, () => {
            let resolveFunction;
            this.#promises.push(new Promise(function(resolve) {
                resolveFunction = resolve;
            }));
            return resolveFunction;    
        });
    }
    
    /**
     * Resolve the Promise at the given index with the given value.
     * @param {number} index Index of the Promise
     * @param {any} value Value to be resolved
     */
    resolve(index, value) {
        if (index !== 0 && !index || index < 0) {
            throw new RangeError("Invalid index");
        }
        this.#resolveFunctions[index](value);
    }

    /**
     * Creates a Promise that is resolved with an array of results when all of
     * the encapsulated Promises resolve.
     * @returns A new Promise.
     */
    all() {
        return Promise.all(this.#promises);
    }

    /**
     * Creates a Promise that is resolved when any of the encapsulated Promises
     * are resolved.
     * @returns A new Promise.
     */
    race() {
        return Promise.race(this.#promises);
    }
}

/**
 * A PromiseSynch cache Promises until settled, providing a synchronization
 * facility with the remaining not yet settled Promises.
 */
class PromiseSynch {
    #index = 0;
    #promises = new Map();
        
    /**
     * Add a Promise to the cache.
     * The promise is automatically removed from the cache once settled.
     * @param {Promise} promise Promise to add.
     */
    add(promise) {
        const index = this.#index++;
        promise = promise.finally(() => this.#promises.delete(index));
        this.#promises.set(index, promise);
    }

    /**
     * Creates a Promise that is resolved when all of the cached Promises are settled.
     * @param {Function} onsettled Optional function to be executed once all Promises are settled.
     * @returns A new Promise.
     */
    allSettled(onsettled) {
        const promise = Promise.allSettled(this.#promises.values());
        return onsettled ? promise.then(onsettled) : promise;
    }

}

module.exports = {
    DeferredPromise, Barrier, PromiseSynch,
}
