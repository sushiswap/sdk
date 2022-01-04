import {
  FACTOR_PRECISION,
  FULL_UTILIZATION_MINUS_MAX,
  INTEREST_ELASTICITY,
  MAXIMUM_INTEREST_PER_YEAR,
  MAXIMUM_TARGET_UTILIZATION,
  MINIMUM_INTEREST_PER_YEAR,
  MINIMUM_TARGET_UTILIZATION,
  PROTOCOL_FEE,
  PROTOCOL_FEE_DIVISOR,
  STARTING_INTEREST_PER_YEAR,
} from '../constants'

import { BigNumber } from '@ethersproject/bignumber'
import { KashiMediumRiskLendingPair } from '../entities'
import { ZERO, JSBI } from '@sushiswap/core-sdk'

export function accrue(pair: KashiMediumRiskLendingPair, amount: JSBI, includePrincipal = false): JSBI {
  return JSBI.add(
    JSBI.divide(
      JSBI.multiply(JSBI.multiply(amount, pair.accrueInfo.interestPerSecond), pair.elapsedSeconds),
      JSBI.BigInt(1e18)
    ),
    includePrincipal ? amount : ZERO
  )
}

export function accrueTotalAssetWithFee(pair: KashiMediumRiskLendingPair): {
  elastic: JSBI
  base: JSBI
} {
  const extraAmount = JSBI.divide(
    JSBI.multiply(
      JSBI.multiply(pair.totalBorrow.elastic, pair.accrueInfo.interestPerSecond),
      JSBI.add(pair.elapsedSeconds, JSBI.BigInt(3600)) // For some transactions, to succeed in the next hour (and not only this block), some margin has to be added
    ),
    JSBI.BigInt(1e18)
  )
  const feeAmount = JSBI.divide(JSBI.multiply(extraAmount, PROTOCOL_FEE), PROTOCOL_FEE_DIVISOR) // % of interest paid goes to fee
  const feeFraction = JSBI.divide(JSBI.multiply(feeAmount, pair.totalAsset.base), pair.currentAllAssets)
  return {
    elastic: pair.totalAsset.elastic,
    base: JSBI.add(pair.totalAsset.base, feeFraction),
  }
}

export function interestAccrue(pair: KashiMediumRiskLendingPair, interest: JSBI): JSBI {
  if (JSBI.equal(pair.totalBorrow.base, ZERO)) {
    return STARTING_INTEREST_PER_YEAR
  }
  if (JSBI.lessThanOrEqual(pair.elapsedSeconds, ZERO)) {
    return interest
  }

  let currentInterest = interest

  if (JSBI.lessThan(pair.utilization, MINIMUM_TARGET_UTILIZATION)) {
    const underFactor = JSBI.greaterThan(MINIMUM_TARGET_UTILIZATION, ZERO)
      ? JSBI.divide(
          JSBI.multiply(JSBI.subtract(MINIMUM_TARGET_UTILIZATION, pair.utilization), FACTOR_PRECISION),
          MINIMUM_TARGET_UTILIZATION
        )
      : ZERO
    const scale = JSBI.add(
      INTEREST_ELASTICITY,
      JSBI.multiply(JSBI.multiply(underFactor, underFactor), pair.elapsedSeconds)
    )
    currentInterest = JSBI.divide(JSBI.multiply(currentInterest, INTEREST_ELASTICITY), scale)

    if (JSBI.lessThan(currentInterest, MINIMUM_INTEREST_PER_YEAR)) {
      currentInterest = MINIMUM_INTEREST_PER_YEAR // 0.25% APR minimum
    }
  } else if (JSBI.greaterThan(pair.utilization, MAXIMUM_TARGET_UTILIZATION)) {
    const overFactor = JSBI.multiply(
      JSBI.subtract(pair.utilization, MAXIMUM_TARGET_UTILIZATION),
      JSBI.divide(FACTOR_PRECISION, FULL_UTILIZATION_MINUS_MAX)
    )
    const scale = JSBI.add(
      INTEREST_ELASTICITY,
      JSBI.multiply(JSBI.multiply(overFactor, overFactor), pair.elapsedSeconds)
    )
    currentInterest = JSBI.divide(JSBI.multiply(currentInterest, scale), INTEREST_ELASTICITY)
    if (JSBI.greaterThan(currentInterest, MAXIMUM_INTEREST_PER_YEAR)) {
      currentInterest = MAXIMUM_INTEREST_PER_YEAR // 1000% APR maximum
    }
  }
  return currentInterest
}

// Subtract protocol fee
export function takeFee(amount: JSBI): JSBI {
  return JSBI.subtract(amount, JSBI.divide(JSBI.multiply(amount, PROTOCOL_FEE), PROTOCOL_FEE_DIVISOR))
}

export function addBorrowFee(amount: BigNumber): BigNumber {
  return amount.mul(BigNumber.from(10005)).div(BigNumber.from(10000))
}

export { computePairAddress } from './computePairAddress'
