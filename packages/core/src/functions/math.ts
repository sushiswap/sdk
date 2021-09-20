import { ONE, TWO, ZERO } from '../constants/numbers'

import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

export const MAX_SAFE_INTEGER = JSBI.BigInt(Number.MAX_SAFE_INTEGER)

/**
 * Computes floor(sqrt(value))
 * @param value the value for which to compute the square root, rounded down
 */
export function sqrt(value: JSBI): JSBI {
  invariant(JSBI.greaterThanOrEqual(value, ZERO), 'NEGATIVE')

  // rely on built in sqrt if possible
  if (JSBI.lessThan(value, MAX_SAFE_INTEGER)) {
    return JSBI.BigInt(Math.floor(Math.sqrt(JSBI.toNumber(value))))
  }

  let z: JSBI
  let x: JSBI
  z = value
  x = JSBI.add(JSBI.divide(value, TWO), ONE)
  while (JSBI.lessThan(x, z)) {
    z = x
    x = JSBI.divide(JSBI.add(JSBI.divide(value, x), x), TWO)
  }
  return z
}

/**
 * Returns the smallest member of the array
 * @param values the values from which the smallest gets returned
 * @returns the smallest memmber of the array
 */
export function minimum(...values: JSBI[]): JSBI {
  let lowest = values[0]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (JSBI.LT(value, lowest)) {
      lowest = value
    }
  }
  return lowest
}

/**
 * Returns the biggest member of the array
 * @param values the values from which the biggest gets returned
 * @returns the biggest memmber of the array
 */
export function maximum(...values: JSBI[]): JSBI {
  let highest = values[0]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (JSBI.GT(value, highest)) {
      highest = value
    }
  }
  return highest
}

export function difference(a: JSBI, b: JSBI): JSBI {
  if (JSBI.greaterThan(a, b)) {
    return JSBI.subtract(a, b)
  }
  return JSBI.subtract(b, a)
}
