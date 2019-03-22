'use strict';

const slice = Array.prototype.slice;

export function merge(a, b) {
  const c = {};

  for (let k in a) { c[k] = a[k]; }
  for (let k in b) { c[k] = b[k]; }

  return c;
}

const _curry = (n, fn, curryArgs = []) => {
  return (...args) => {
    const concatArgs = curryArgs.concat(args);

    return n > concatArgs.length
      ? _curry(n, fn, concatArgs)
      : fn.apply(null, concatArgs);
  };
};

export function curry(fn) { return _curry(fn.length, fn); }

export function curryN(n, fn) { return _curry(n, fn); }

export const curry1 = curryN(2, curryN)(1);
export const curry2 = curryN(2, curryN)(2);
export const curry3 = curryN(2, curryN)(3);
export const curry4 = curryN(2, curryN)(4);

export const apply = curry2((fn, args) => fn.apply(null, args));

export const identity = a => a;
export const always = a => true;
export const never = a => false;
export const head = a => a[0];
export const last = a => a[a.length - 1];
export const tail = a => a.slice(1);
export const init = a => a.slice(0, -1);

export const when = curry2((predicates, ...values) => {
  const doWhen = (a) => {
    const [predicate, resolve] = head(a);
    return predicate(...values) ? resolve(...values) : doWhen(tail(a));
  };

  return doWhen(predicates);
});

export const asArray = (collection) => slice.call(collection);
export const asPair = (object) => Object.keys(object).map((k) => [k, object[k]]);
