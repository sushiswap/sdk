import JSBI from 'jsbi'

import { ZERO } from '@sushiswap/core-sdk'

import { BentoToken } from '../interfaces'

export function toAmount(token: BentoToken, shares: JSBI): JSBI {
  return JSBI.GT(token.base, 0) ? JSBI.divide(JSBI.multiply(shares, token.elastic), token.base) : ZERO
}

export function toShare(token: BentoToken, amount: JSBI): JSBI {
  return JSBI.GT(token.elastic, 0) ? JSBI.divide(JSBI.multiply(amount, token.base), token.elastic) : ZERO
}
