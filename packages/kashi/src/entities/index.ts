import JSBI from 'jsbi'

import { maximum, minimum } from '@sushiswap/core-sdk'
import { BentoToken, toAmount, toShare } from '@sushiswap/bentobox-sdk'

import { AccrueInfo } from 'src/interfaces'
import { accrue, accrueTotalAssetWithFee, interestAccrue, takeFee } from 'src/functions'

export class KashiMediumRiskLendingPair {
  public readonly accrueInfo: AccrueInfo
  public readonly collateral: BentoToken
  public readonly asset: BentoToken
  public readonly totalCollateralShare: JSBI
  public readonly totalAsset: BentoToken
  public readonly totalBorrow: BentoToken
  public readonly exchangeRate: JSBI
  public readonly oracleExchangeRate: JSBI
  public readonly spotExchangeRate: JSBI

  public constructor(
    accrueInfo: AccrueInfo,
    collateral: BentoToken,
    asset: BentoToken,
    totalCollateralShare: JSBI,
    totalAsset: BentoToken,
    totalBorrow: BentoToken,
    exchangeRate: JSBI,
    oracleExchangeRate: JSBI,
    spotExchangeRate: JSBI
  ) {
    this.accrueInfo = accrueInfo
    this.collateral = collateral
    this.asset = asset
    this.totalCollateralShare = totalCollateralShare
    this.totalAsset = totalAsset
    this.totalBorrow = totalBorrow
    this.exchangeRate = exchangeRate
    this.oracleExchangeRate = oracleExchangeRate
    this.spotExchangeRate = spotExchangeRate
  }

  /**
   * Returns the number of elapsed seconds since the last accrue
   */
  public get elapsedSeconds(): JSBI {
    const currentDate = JSBI.divide(JSBI.BigInt(Date.now()), JSBI.BigInt(1000))
    return JSBI.subtract(currentDate, this.accrueInfo.lastAccrued)
  }

  /**
   * Interest per year for borrowers at last accrue, this will apply during the next accrue
   */
  public get interestPerYear(): JSBI {
    return JSBI.multiply(this.accrueInfo.interestPerSecond, JSBI.BigInt(60 * 60 * 24 * 365))
  }

  /**
   * Interest per year for borrowers if accrued was called
   */
  public get currentInterestPerYear(): JSBI {
    return interestAccrue(this, this.interestPerYear)
  }

  /**
   * The total collateral in the market (collateral is stable, it doesn't accrue)
   */
  public get totalCollateralAmount(): JSBI {
    return toAmount(this.collateral, this.totalCollateralShare)
  }

  /**
   * The total assets unborrowed in the market (stable, doesn't accrue)
   */
  public get totalAssetAmount(): JSBI {
    return toAmount(this.asset, this.totalAsset.elastic)
  }

  /**
   * The total assets borrowed in the market right now
   */
  public get currentBorrowAmount(): JSBI {
    return accrue(this, this.totalBorrow.elastic, true)
  }

  /**
   * The total amount of assets, both borrowed and still available right now
   */
  public get currentAllAssets(): JSBI {
    return JSBI.add(this.totalAssetAmount, this.currentBorrowAmount)
  }

  /**
   * Current total amount of asset shares
   */
  public get currentAllAssetShares(): JSBI {
    return toShare(this.asset, this.currentAllAssets)
  }

  /**
   * Current totalAsset with the protocol fee accrued
   */
  public get currentTotalAsset() {
    return accrueTotalAssetWithFee(this)
  }

  /**
   * The maximum amount of assets available for withdrawal or borrow
   */
  public get maxAssetAvailable(): JSBI {
    return minimum(
      JSBI.divide(JSBI.multiply(this.totalAsset.elastic, this.currentAllAssets), this.currentAllAssetShares)
    )
  }

  /**
   * The maximum amount of assets available for withdrawal or borrow in shares
   */
  public get maxAssetAvailableFraction(): JSBI {
    return JSBI.divide(JSBI.multiply(this.maxAssetAvailable, this.currentTotalAsset.base), this.currentAllAssets)
  }

  /**
   * The overall health of the lending pair
   */
  public get marketHealth(): JSBI {
    return JSBI.divide(
      JSBI.multiply(
        JSBI.divide(
          JSBI.multiply(this.totalCollateralAmount, JSBI.BigInt(1e18)),
          maximum(this.exchangeRate, this.spotExchangeRate, this.oracleExchangeRate)
        ),
        JSBI.BigInt(1e18)
      ),
      this.currentBorrowAmount
    )
  }

  /**
   * The current utilization in %
   */
  public get utilization(): JSBI {
    return JSBI.divide(JSBI.multiply(JSBI.BigInt(1e18), this.currentBorrowAmount), this.currentAllAssets)
  }

  /**
   * Interest per year received by lenders as of now
   */
  public get supplyAPR(): JSBI {
    return takeFee(JSBI.divide(JSBI.multiply(this.interestPerYear, this.utilization), JSBI.BigInt(1e18)))
  }

  /**
   * Interest per year received by lenders if accrue was called
   */
  public get currentSupplyAPR(): JSBI {
    return takeFee(JSBI.divide(JSBI.multiply(this.currentInterestPerYear, this.utilization), JSBI.BigInt(1e18)))
  }
}
