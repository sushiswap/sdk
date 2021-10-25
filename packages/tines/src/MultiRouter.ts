import { BigNumber } from "@ethersproject/bignumber";
import { MultiRoute, Graph } from "./Graph";
import { RPool, RToken } from "./PrimaryPools";  

// Assumes route is a single path
function calcPriceImactWithoutFee(route: MultiRoute) {
  if (route.primaryPrice === undefined || route.swapPrice === undefined) {
    return undefined
  } else {
    let oneMinusCombinedFee = 1
    route.legs.forEach(l => oneMinusCombinedFee *= (1-l.poolFee))
    //const combinedFee = 1-oneMinusCombinedFee
    return Math.max(0, 1-route.swapPrice/route.primaryPrice/oneMinusCombinedFee)
  }
}

const defaultFlowNumber = 12
const maxFlowNumber = 100
function calcBestFlowNumber(bestSingleRoute: MultiRoute, amountIn: number, gasPriceIn?: number): number {
  const priceImpact = calcPriceImactWithoutFee(bestSingleRoute)
  if (!priceImpact) return defaultFlowNumber

  const bestFlowAmount = Math.sqrt(bestSingleRoute.gasSpent*(gasPriceIn || 0)*amountIn/priceImpact)
  const bestFlowNumber = Math.round(amountIn/bestFlowAmount)
  if (!isFinite(bestFlowNumber)) return defaultFlowNumber

  const realFlowNumber = Math.max(1, Math.min(bestFlowNumber, maxFlowNumber))
  return realFlowNumber
}

export function findMultiRouteExactIn(
  from: RToken,
  to: RToken,
  amountIn: BigNumber | number,
  pools: RPool[],
  baseToken: RToken,
  gasPrice: number,
  flows?: number | number[]
): MultiRoute {
  if (amountIn instanceof BigNumber) {
    amountIn = parseInt(amountIn.toString())
  }

  const g = new Graph(pools, baseToken, gasPrice)
  const fromV = g.tokens.get(from.address)
  if (fromV?.price === 0) {
    g.setPrices(fromV, 1, 0)
  }

  if (flows !== undefined) return g.findBestRouteExactIn(from, to, amountIn, flows)

  const outSingle = g.findBestRouteExactIn(from, to, amountIn, 1)
  // Possible optimization of timing
  // if (g.findBestPathExactIn(from, to, amountIn/100 + 10_000, 0)?.gasSpent === 0) return outSingle
  g.cleanTmpData()

  const bestFlowNumber = calcBestFlowNumber(outSingle, amountIn, fromV?.gasPrice)
  if (bestFlowNumber === 1) return outSingle

  const outMulti = g.findBestRouteExactIn(from, to, amountIn, bestFlowNumber)
  return outSingle.totalAmountOut > outMulti.totalAmountOut ? outSingle : outMulti
}

export function findMultiRouteExactOut(
  from: RToken,
  to: RToken,
  amountOut: BigNumber | number,
  pools: RPool[],
  baseToken: RToken,
  gasPrice: number,
  flows?: number | number[]
): MultiRoute {
  if (amountOut instanceof BigNumber) {
    amountOut = parseInt(amountOut.toString())
  }

  const g = new Graph(pools, baseToken, gasPrice)
  const fromV = g.tokens.get(from.address)
  if (fromV?.price === 0) {
    g.setPrices(fromV, 1, 0)
  }

  if (flows !== undefined) return g.findBestRouteExactOut(from, to, amountOut, flows)

  const inSingle = g.findBestRouteExactOut(from, to, amountOut, 1)
  // Possible optimization of timing
  // if (g.findBestPathExactOut(from, to, amountOut/100 + 10_000, 0)?.gasSpent === 0) return inSingle
  g.cleanTmpData()

  const bestFlowNumber = calcBestFlowNumber(inSingle, inSingle.amountIn, fromV?.gasPrice)
  if (bestFlowNumber === 1) return inSingle

  const inMulti = g.findBestRouteExactOut(from, to, amountOut, bestFlowNumber)
  const totalAmountSingle = inSingle.amountIn + inSingle.gasSpent*gasPrice
  const totalAmountMulti = inMulti.amountIn + inMulti.gasSpent*gasPrice
  return totalAmountSingle < totalAmountMulti ? inSingle : inMulti
}

export function findSingleRouteExactIn(
  from: RToken,
  to: RToken,
  amountIn: BigNumber | number,
  pools: RPool[],
  baseToken: RToken,
  gasPrice: number
): MultiRoute {
  const g = new Graph(pools, baseToken, gasPrice)
  const fromV = g.tokens.get(from.address)
  if (fromV?.price === 0) {
    g.setPrices(fromV, 1, 0)
  }

  if (amountIn instanceof BigNumber) {
    amountIn = parseInt(amountIn.toString())
  }

  const out = g.findBestRouteExactIn(from, to, amountIn, 1)
  return out
}

export function findSingleRouteExactOut(
  from: RToken,
  to: RToken,
  amountOut: BigNumber | number,
  pools: RPool[],
  baseToken: RToken,
  gasPrice: number
): MultiRoute {
  const g = new Graph(pools, baseToken, gasPrice)
  const fromV = g.tokens.get(from.address)
  if (fromV?.price === 0) {
    g.setPrices(fromV, 1, 0)
  }

  if (amountOut instanceof BigNumber) {
    amountOut = parseInt(amountOut.toString())
  }

  const out = g.findBestRouteExactOut(from, to, amountOut, 1)
  return out
}