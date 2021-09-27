import { ASSERT, calcSquareEquation, ConstantProductRPool, getBigNumber, RPool, RToken } from "./";

interface JumpInfo {
  poolIndex: number;
  input: number;
  output: number;
  price: number;
  combinedLiquidityY: number;
  gasCost: number
}

export class ParallelCPRPool extends RPool {
  readonly token0: RToken
  readonly allPools: ConstantProductRPool[]
  readonly gasPrice: number
  jumps0?: JumpInfo[]
  jumps1?: JumpInfo[]

  constructor(
    inputToken: RToken,
    pools: ConstantProductRPool[],
    gasPrice: number
  ) {
      super(
        'ParallelCPRPool',
        pools[0].token0,
        pools[0].token1,
        0,
        getBigNumber(pools.reduce((a, b) => a + b.reserve0Number, 0)),
        getBigNumber(pools.reduce((a, b) => a + b.reserve1Number/(1-b.fee), 0)),
      );
      // this.pools = pools.map((p):[ConstantProductRPool, number] => [p, p.getLiquidity()/(1-p.fee)])
      //   .sort(([_1, l1], [_2, l2]) => l1-l2)
      // console.log("pools", this.pools.map(p => p[0].getLiquidity()));
      this.token0 = inputToken
      this.allPools = pools
      this.gasPrice = gasPrice
  }

  //TODO:
  // 1) weak pool test
  // 2) directions: true/fasle
  // 3) poolPrice < priceCurrent
  // 4) 1 pool result == findMultiRouting
  // 5) n pool result > findMultiRouting
  // 6) Several equal pools
  calcNextJumpforPool(pool: ConstantProductRPool, poolIndex: number, direction: boolean, prevJump?: JumpInfo): JumpInfo | undefined {
    const dir = (this.token0.address === pool.token0.address) === direction
    const poolPrice = pool.calcPrice(0, dir, true)
    const y = dir ? pool.reserve1Number : pool.reserve0Number
    if (prevJump === undefined ) return {
      poolIndex,
      input: 0,
      output: 0,
      price: poolPrice,
      combinedLiquidityY: y,
      gasCost: pool.swapGasCost
    }

    const swapCost = this.gasPrice * pool.swapGasCost
    if ( y < swapCost) return     // pool is too weak to pay off swap gas cost

    const combinedYNew = Math.sqrt(poolPrice/prevJump.price)*prevJump.combinedLiquidityY
    console.assert(combinedYNew > 0, "Internal error 45")
    const outputFirst = prevJump.combinedLiquidityY - combinedYNew   // TODO: check if negative !!!!
    const inputFirst = prevJump.combinedLiquidityY*outputFirst/prevJump.price/combinedYNew

    const [in1, inputSecond] = calcSquareEquation(swapCost-y, swapCost*(2*combinedYNew + y)/poolPrice, 
      swapCost*combinedYNew*(combinedYNew+y)/poolPrice/poolPrice)
    console.assert(in1 < 0, "Internal Error 53")
    console.assert(inputSecond > 0, "Internal Error 54")
    const outputSecond = combinedYNew*inputSecond/(combinedYNew/poolPrice + inputSecond) + swapCost
    ASSERT(() => {
      const outputSecond2 = (combinedYNew + y)*inputSecond/((combinedYNew + y)/poolPrice + inputSecond)
      return Math.abs(outputSecond/outputSecond2 - 1) < 1e-12
    }, "Internal Error 62")
    const combinedYFinal = combinedYNew - outputSecond
    const priceFinal = poolPrice* Math.pow(combinedYFinal/combinedYNew, 2)
    return {
      poolIndex,
      input: prevJump.input + inputFirst + inputSecond,
      output: prevJump.output + outputFirst + outputSecond,
      price: priceFinal,
      combinedLiquidityY: combinedYFinal,
      gasCost: prevJump.gasCost + pool.swapGasCost
    }
  }

  calcBestJump(pools: ConstantProductRPool[], direction: boolean, prevJump?: JumpInfo): JumpInfo | undefined {
    let bestJump: JumpInfo | undefined;
    pools.forEach( (p, i) => {
      const jump = this.calcNextJumpforPool(p, i, direction, prevJump)
      if (bestJump === undefined) bestJump = jump
      else if (jump !== undefined && jump.input < bestJump.input) bestJump = jump
    })
    return bestJump
  }

  calcJumps(direction: boolean): JumpInfo[] {
    let jumps = direction ? this.jumps0 : this.jumps1
    if (jumps !== undefined) return jumps

    jumps = []
    const unusedPools = [...this.allPools]
    let bestJump = this.calcBestJump(unusedPools, direction)
    while(bestJump !== undefined) {
      jumps.push(bestJump)
      unusedPools.splice(bestJump.poolIndex)
      bestJump = this.calcBestJump(unusedPools, direction, bestJump)
    }

    if (direction) this.jumps0 = jumps
    else this.jumps1 = jumps

    return jumps
  }

  // quadratic by number of pools - do not use for large number of pools !
  /*calcOutByIn2(amountIn: number, direction: boolean): [number, number] {
    function calcOutForPools(pools: [ConstantProductRPool, number][], amountIn: number, direction: boolean): [number, number] {
      console.log("calcOutForPools ", pools.length);
      
      let outTotal = 0
      let gasTotal = 0
      const totalLiquidity = pools.reduce((a, [_, l]) => a + l, 0)
      pools.forEach(([p, l]) => {
        const partition = l/totalLiquidity
        const [out, gas] = p.calcOutByIn(amountIn*partition, direction);
        outTotal += out
        gasTotal += gas
      })
      return [outTotal, gasTotal]
    }
    let outPrev = 0
    let gasPrev = 0
    let outTotalPrev = 0
    for (let i = 0; i < this.pools.length; ++i) {
      const [out, gas] = calcOutForPools(this.pools.slice(0, i+1), amountIn, direction)
      const outTotal = out - gas*this.gasPrice
      if (outTotal < outTotalPrev) break
      outPrev = out
      gasPrev = gas
      outTotalPrev = outTotal
    }
    return [outPrev, gasPrev];
  }*/

  getJump(direction: boolean, less: (j: JumpInfo) => boolean) {
    const jumps = this.calcJumps(direction)
    let a = 0, b = jumps.length - 1
    while( (b-a) > 1) {
      const c = (a+b)/2
      if (less(jumps[c])) a = c
      else b = c
    }
    return less(jumps[b]) ? jumps[b] : jumps[a]
  }

  calcOutByIn(amountIn: number, direction: boolean): [number, number] {
    const jump = this.getJump(direction, j => j.input <= amountIn)
    console.assert(amountIn >= jump.input)

    const addInput = amountIn - jump.input
    const addOutput = jump.combinedLiquidityY*addInput/(jump.combinedLiquidityY/jump.price + addInput)
    return [jump.output + addOutput, jump.gasCost]
  }

  calcInByOut(amountOut: number, direction: boolean): [number, number] {
    const jump = this.getJump(direction, j => j.output <= amountOut)
    console.assert(amountOut >= jump.input)

    const addOutput = amountOut - jump.output
    let addInput = jump.combinedLiquidityY/jump.price*addOutput/(jump.combinedLiquidityY - addOutput)
    if (addInput < 0) addInput = 0
    return [jump.input + addInput, jump.gasCost]
  }

  calcCurrentPriceWithoutFee(direction: boolean): number {
    let bestLiquidity: number | undefined
    let price: number | undefined
    this.allPools.forEach(p => {
      const l = p.getLiquidity()
      if (bestLiquidity === undefined) {
        bestLiquidity = l
        price = p.calcCurrentPriceWithoutFee(direction)
      }
    })
    return price as number
  }
}