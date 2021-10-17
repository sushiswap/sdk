export { IPool } from './IPool'
import { BigNumber } from '@ethersproject/bignumber'
import { RouteType } from '../enums/RouteType'

export interface InitialPath {
  tokenIn: string
  pool: string
  native: boolean
  amount: BigNumber
  data: string
}

export interface PercentagePath {
  tokenIn: string
  pool: string
  balancePercentage: BigNumber
  data: string
}

export interface Path {
  pool: string
  data: string
}

export interface Output {
  token: string
  to: string
  unwrapBento: boolean
  minAmount: BigNumber
}

export interface ComplexPathParams extends TridentRoute {
  initialPath: InitialPath[]
  percentagePath: PercentagePath[]
  output: Output[]
}

export interface ExactInputSingleParams extends TridentRoute {
  amountIn: BigNumber
  amountOutMinimum: BigNumber
  tokenIn: string
  pool: string
  data: string
}

export interface ExactInputParams extends TridentRoute {
  tokenIn: string
  amountIn: BigNumber
  amountOutMinimum: BigNumber
  path: Path[]
}

export interface TridentRoute {
  routeType: RouteType
}
