import { BigNumber } from '@ethersproject/bignumber'
import { Zero } from '@ethersproject/constants'

export function toAmount(token, shares: BigNumber): BigNumber {
  return BigNumber.from(token.bentoShare).gt(0) ? shares.mul(token.bentoAmount).div(token.bentoShare) : Zero
}

export function toShare(token, amount: BigNumber): BigNumber {
  return BigNumber.from(token.bentoAmount).gt(0) ? amount.mul(token.bentoShare).div(token.bentoAmount) : Zero
}
