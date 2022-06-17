import { BigNumber } from "@ethersproject/bignumber";
import { RPool, RToken} from "./PrimaryPools";
import { getBigNumber } from './Utils'

interface Rebase {
  elastic: BigNumber
  base: BigNumber
}

function toAmountBN(share: BigNumber, total: Rebase) {
  if (total.base.isZero() || total.elastic.isZero()) return share
  return share.mul(total.elastic).div(total.base)
}

class RebaseInternal {
  elastic2Base: number
  rebaseBN: Rebase

  constructor(rebase: Rebase) {
    this.rebaseBN = rebase
    if (rebase.base.isZero() || rebase.elastic.isZero())
      this.elastic2Base = 1
    else
      this.elastic2Base = parseInt(rebase.elastic.toString())/parseInt(rebase.base.toString())
  }

  toAmount(share: number) {
    return share*this.elastic2Base
  }

  toShare(amount: number) {
    return amount/this.elastic2Base
  }

  toAmountBN(share: BigNumber) {
    return toAmountBN(share, this.rebaseBN)
  }
}

// xy(xx+yy) = k
export class StableSwapRPool extends RPool {
  k: BigNumber // set it to 0 if reserves are changed !!
  total0 : RebaseInternal
  total1: RebaseInternal

  constructor(
    address: string, 
    token0: RToken, 
    token1: RToken, 
    fee: number, 
    reserve0: BigNumber,
    reserve1: BigNumber,
    total0 : Rebase,
    total1: Rebase,
  ) {
    super(address, token0, token1, fee, toAmountBN(reserve0, total0), toAmountBN(reserve1, total1))
    this.k = BigNumber.from(0)
    this.total0 = new RebaseInternal(total0)
    this.total1 = new RebaseInternal(total1)
  }

  updateReserves(res0: BigNumber, res1: BigNumber) {
    this.k = BigNumber.from(0)
    this.reserve0 = this.total0.toAmountBN(res0)
    this.reserve1 = this.total1.toAmountBN(res1)
  }

  computeK(): BigNumber {
    if (this.k.isZero()) {
      const x = this.reserve0
      const y = this.reserve1
      this.k = x.mul(y).mul( x.mul(x).add(y.mul(y)) )
    }
    return this.k
  }

  computeY(x: BigNumber, yHint: BigNumber): BigNumber {
    const k = this.computeK()
    const x2 = x.shl(1)
    const x3 = x.mul(3)
    const xCube = x.mul(x).mul(x)
    let yPrev = yHint, y = yHint
    for (let i = 0; i < 255; ++i) {
      const ySquare = y.mul(y)
      const yCube = ySquare.mul(y)
      y = yCube.mul(x2).add(k).div( ySquare.mul(x3).add(xCube) )
      if (y.sub(yPrev).abs().lte(1)) break
      yPrev = y
    }
    return y
  }

  calcOutByIn(amountIn: number, direction: boolean): {out: number, gasSpent: number} {
    amountIn = direction ? this.total0.toAmount(amountIn) : this.total1.toAmount(amountIn)
    const x = direction ? this.reserve0 : this.reserve1
    const y = direction ? this.reserve1 : this.reserve0
    const xNew = x.add(getBigNumber(Math.floor(amountIn * (1 - this.fee))))
    const yNew = this.computeY(xNew, y)
    const outA = parseInt(y.sub(yNew).toString()) - 1    // with precision loss compensation
    const outB = Math.max(outA, 0)
    const out = direction ? this.total1.toShare(outB) : this.total0.toShare(outB)
    return {out, gasSpent: this.swapGasCost}
  }

  calcInByOut(amountOut: number, direction: boolean): {inp: number, gasSpent: number} {
    amountOut = direction ? this.total0.toAmount(amountOut) : this.total1.toAmount(amountOut)
    const x = direction ? this.reserve0 : this.reserve1
    const y = direction ? this.reserve1 : this.reserve0
    let yNew = y.sub(getBigNumber(Math.ceil(amountOut)))
    if (yNew.lt(this.minLiquidity))  // not possible swap
      return {inp: Number.POSITIVE_INFINITY, gasSpent: this.swapGasCost}

    const xNew = this.computeY(yNew, x)
    const input = Math.round(parseInt(xNew.sub(x).toString()) / (1 - this.fee)) + 1  // with precision loss compensation
    const inp = direction ? this.total1.toShare(input) : this.total0.toShare(input)
    return {inp, gasSpent: this.swapGasCost}
  }

  calcCurrentPriceWithoutFee(direction: boolean): number {
    const calcDirection = this.reserve0.gt(this.reserve1)
    const xBN = calcDirection ? this.reserve0 : this.reserve1
    // TODO: make x = max(x, y)
    const x = parseInt(xBN.toString())
    const k = parseInt(this.computeK().toString())
    const q = k/x/2
    const qD = -q/x                           // devivative of q
    const Q = Math.pow(x, 6)/27 + q*q
    const QD = 6*Math.pow(x, 5)/27 + 2*q*qD   // derivative of Q
    const sqrtQ = Math.sqrt(Q)
    const sqrtQD = 1/2/sqrtQ*QD               // derivative of sqrtQ
    const a = sqrtQ + q
    const aD = sqrtQD + qD
    const b = sqrtQ - q
    const bD = sqrtQD - qD
    const a3 = Math.pow(a, 1/3)
    const a3D = 1/3*a3/a*aD
    const b3 = Math.pow(b, 1/3)
    const b3D = 1/3*b3/b*bD
    const yD = a3D - b3D
    const yDShares = calcDirection ? 
      this.total1.toShare(this.total0.toAmount(yD)) :
      this.total0.toShare(this.total1.toAmount(yD))
    
    return calcDirection == direction ? -yDShares : -1/yDShares
  }

}