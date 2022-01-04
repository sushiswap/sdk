import { AccrueInfo } from './AccrueInfo'
import { Rebase, JSBI } from '@sushiswap/core-sdk'

export interface KashiPair {
  readonly accrueInfo: AccrueInfo
  readonly collateral: Rebase
  readonly asset: Rebase
  readonly totalCollateralShare: JSBI
  readonly totalAsset: Rebase
  readonly totalBorrow: Rebase
  readonly exchangeRate: JSBI
  readonly oracleExchangeRate: JSBI
  readonly spotExchangeRate: JSBI
  readonly userCollateralShare: JSBI
  readonly userAssetFraction: JSBI
  readonly userBorrowPart: JSBI
}
