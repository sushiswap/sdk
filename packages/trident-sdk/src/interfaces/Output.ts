import { BigNumber } from '@ethersproject/bignumber'

export interface Output {
  token: string
  to: string
  unwrapBento: boolean
  minAmount: BigNumber
}
