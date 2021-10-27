import { BigNumber } from '@ethersproject/bignumber'

export interface PercentagePath {
  tokenIn: string
  pool: string
  balancePercentage: BigNumber
  data: string
}
