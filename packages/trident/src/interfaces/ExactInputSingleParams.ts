import { BigNumber } from '@ethersproject/bignumber'
import { TridentRoute } from './TridentRoute'

export interface ExactInputSingleParams extends TridentRoute {
  amountIn: BigNumber
  amountOutMinimum: BigNumber
  tokenIn: string
  pool: string
  data: string
}
