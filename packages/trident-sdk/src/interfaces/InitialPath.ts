import { BigNumber } from '@ethersproject/bignumber'

export interface InitialPath {
  tokenIn: string
  pool: string
  native: boolean
  amount: BigNumber
  data: string
}
