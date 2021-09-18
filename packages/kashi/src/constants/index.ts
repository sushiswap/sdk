import JSBI from 'jsbi'

// Functions that need accrue to be called
export const ACTION_ADD_ASSET = 1
export const ACTION_REPAY = 2
export const ACTION_REMOVE_ASSET = 3
export const ACTION_REMOVE_COLLATERAL = 4
export const ACTION_BORROW = 5
export const ACTION_GET_REPAY_SHARE = 6
export const ACTION_GET_REPAY_PART = 7
export const ACTION_ACCRUE = 8

// Functions that don't need accrue to be called
export const ACTION_ADD_COLLATERAL = 10
export const ACTION_UPDATE_EXCHANGE_RATE = 11

// Function on BentoBox
export const ACTION_BENTO_DEPOSIT = 20
export const ACTION_BENTO_WITHDRAW = 21
export const ACTION_BENTO_TRANSFER = 22
export const ACTION_BENTO_TRANSFER_MULTIPLE = 23
export const ACTION_BENTO_SETAPPROVAL = 24

// Any external call (except to BentoBox)
export const ACTION_CALL = 30

export const MINIMUM_TARGET_UTILIZATION = JSBI.BigInt('700000000000000000') // 70%

export const MAXIMUM_TARGET_UTILIZATION = JSBI.BigInt('800000000000000000') // 80%

export const UTILIZATION_PRECISION = JSBI.BigInt('1000000000000000000')

export const FULL_UTILIZATION = JSBI.BigInt('1000000000000000000')

export const FULL_UTILIZATION_MINUS_MAX = JSBI.subtract(FULL_UTILIZATION, MAXIMUM_TARGET_UTILIZATION)

// approx 1% APR
export const STARTING_INTEREST_PER_YEAR = JSBI.multiply(JSBI.BigInt(317097920), JSBI.BigInt(60 * 60 * 24 * 365))

// approx 0.25% APR
export const MINIMUM_INTEREST_PER_YEAR = JSBI.multiply(JSBI.BigInt(79274480), JSBI.BigInt(60 * 60 * 24 * 365))

// approx 1000% APR
export const MAXIMUM_INTEREST_PER_YEAR = JSBI.multiply(JSBI.BigInt(317097920000), JSBI.BigInt(60 * 60 * 24 * 365))

export const INTEREST_ELASTICITY = JSBI.BigInt('28800000000000000000000000000000000000000') // Half or double in 28800 seconds (8 hours) if linear

export const FACTOR_PRECISION = JSBI.BigInt('1000000000000000000')

export const PROTOCOL_FEE = JSBI.BigInt('10000') // 10%

export const PROTOCOL_FEE_DIVISOR = JSBI.BigInt('100000')
