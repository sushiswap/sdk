import JSBI from 'jsbi'

export interface AccrueInfo {
  interestPerSecond: JSBI
  lastAccrued: JSBI
  feesEarnedFraction: JSBI
}
