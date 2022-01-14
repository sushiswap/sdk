import { BigNumber } from '@ethersproject/bignumber'
import { Path } from './Path'
import { TridentRoute } from './TridentRoute'

export interface ExactInputParams extends TridentRoute {
  tokenIn: string
  amountIn: BigNumber
  amountOutMinimum: BigNumber
  path: Path[]
}
