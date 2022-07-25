import { ZERO, JSBI, Rebase } from '@sushiswap/core-sdk'

export function toAmount(rebase: Rebase, shares: JSBI, roundUp = false): JSBI {
  if (JSBI.EQ(rebase.base, ZERO)) return shares

  const elastic = JSBI.divide(JSBI.multiply(shares, rebase.elastic), rebase.base)

  if (roundUp && JSBI.LT(JSBI.divide(JSBI.multiply(elastic, rebase.base), rebase.elastic), shares)) {
    return JSBI.add(elastic, JSBI.BigInt(1))
  }

  return elastic
}

export function toShare(rebase: Rebase, amount: JSBI, roundUp = false): JSBI {
  if (JSBI.EQ(rebase.elastic, ZERO)) return amount

  const base = JSBI.divide(JSBI.multiply(amount, rebase.base), rebase.elastic)

  if (roundUp && JSBI.LT(JSBI.divide(JSBI.multiply(base, rebase.elastic), rebase.base), amount)) {
    return JSBI.add(base, JSBI.BigInt(1))
  }

  return base
}
