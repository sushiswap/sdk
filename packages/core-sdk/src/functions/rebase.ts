import JSBI from 'jsbi'

import { ONE, ZERO } from '../constants'
import { Rebase } from '../interfaces'

export function rebase(value: JSBI, from: JSBI, to: JSBI): JSBI {
  return from ? JSBI.divide(JSBI.multiply(value, to), from) : ZERO
}

export function toElastic(total: Rebase, base: JSBI, roundUp: boolean): JSBI {
  let elastic: JSBI
  if (JSBI.equal(total.base, ZERO)) {
    elastic = base
  } else {
    elastic = JSBI.divide(JSBI.multiply(base, total.elastic), total.base)
    if (roundUp && JSBI.lessThan(JSBI.divide(JSBI.multiply(elastic, total.base), total.elastic), base)) {
      elastic = JSBI.add(elastic, ONE)
    }
  }

  return elastic
}
