import {
  CL_MAX_TICK,
  CL_MIN_TICK,
  Pool,
  PoolType,
  RConcentratedLiquidityPool,
  RHybridPool,
  RWeightedPool,
} from "./MultiRouterTypes";

import { BigNumber } from "@ethersproject/bignumber";
import { computeHybridLiquidity } from "./functions/computeHybridLiquidity";

const A_PRECISION = 100;

const DCacheBN = new Map<Pool, BigNumber>();

export function HybridComputeLiquidity(pool: RHybridPool): BigNumber {
  const res = DCacheBN.get(pool);
  if (res !== undefined) return res;
  const D = computeHybridLiquidity(pool.reserve0, pool.reserve1, pool.A);
  DCacheBN.set(pool, D);
  return D;
}

export function HybridgetY(pool: RHybridPool, x: BigNumber): BigNumber {
  const D = HybridComputeLiquidity(pool);

  const nA = pool.A * 2;

  let c = D.mul(D)
    .div(x.mul(2))
    .mul(D)
    .div((nA * 2) / A_PRECISION);
  let b = D.mul(A_PRECISION).div(nA).add(x);

  let yPrev;
  let y = D;
  for (let i = 0; i < 256; i++) {
    yPrev = y;

    y = y.mul(y).add(c).div(y.mul(2).add(b).sub(D));
    if (y.sub(yPrev).abs().lte(1)) {
      break;
    }
  }
  return y;
}

export function calcOutByIn(
  pool: Pool,
  amountIn: number,
  direction = true
): number {
  const xBN = direction ? pool.reserve0 : pool.reserve1;
  const yBN = direction ? pool.reserve1 : pool.reserve0;
  switch (pool.type) {
    case PoolType.ConstantProduct: {
      const x = parseInt(xBN.toString());
      const y = parseInt(yBN.toString());
      return (y * amountIn) / (x / (1 - pool.fee) + amountIn);
    }
    case PoolType.Weighted: {
      const x = parseInt(xBN.toString());
      const y = parseInt(yBN.toString());
      const wPool = pool as RWeightedPool;
      const weightRatio = direction
        ? wPool.weight0 / wPool.weight1
        : wPool.weight1 / wPool.weight0;
      const actualIn = amountIn * (1 - pool.fee);
      const out = y * (1 - Math.pow(x / (x + actualIn), weightRatio));
      return out;
    }
    case PoolType.Hybrid: {
      // const xNew = x + amountIn*(1-pool.fee);
      // const yNew = HybridgetY(pool, xNew);
      // const dy = y - yNew;

      const xNewBN = xBN.add(
        getBigNumber(undefined, amountIn * (1 - pool.fee))
      );
      const yNewBN = HybridgetY(pool as RHybridPool, xNewBN);
      const dy = parseInt(yBN.sub(yNewBN).toString());

      return dy;
    }
    case PoolType.ConcentratedLiquidity: {
      return ConcentratedLiquidityOutByIn(
        pool as RConcentratedLiquidityPool,
        amountIn,
        direction
      );
    }
  }
}

export class OutOfLiquidity extends Error {}

function ConcentratedLiquidityOutByIn(
  pool: RConcentratedLiquidityPool,
  inAmount: number,
  direction: boolean
) {
  if (pool.ticks.length === 0) return 0;
  if (pool.ticks[0].index > CL_MIN_TICK)
    pool.ticks.unshift({ index: CL_MIN_TICK, DLiquidity: 0 });
  if (pool.ticks[pool.ticks.length - 1].index < CL_MAX_TICK)
    pool.ticks.push({ index: CL_MAX_TICK, DLiquidity: 0 });

  let nextTickToCross = direction ? pool.nearestTick : pool.nearestTick + 1;
  let currentPrice = pool.sqrtPrice;
  let currentLiquidity = pool.liquidity;
  let outAmount = 0;
  let input = inAmount;

  while (input > 0) {
    if (nextTickToCross < 0 || nextTickToCross >= pool.ticks.length)
      throw new OutOfLiquidity();

    const nextTickPrice = Math.sqrt(
      Math.pow(1.0001, pool.ticks[nextTickToCross].index)
    );
    // console.log('L, P, tick, nextP', currentLiquidity,
    //     currentPrice, pool.ticks[nextTickToCross].index, nextTickPrice);
    let output = 0;

    if (direction) {
      const maxDx =
        (currentLiquidity * (currentPrice - nextTickPrice)) /
        currentPrice /
        nextTickPrice;
      //console.log('input, maxDx', input, maxDx);

      if (input <= maxDx) {
        output =
          (currentLiquidity * currentPrice * input) /
          (input + currentLiquidity / currentPrice);
        input = 0;
      } else {
        output = currentLiquidity * (currentPrice - nextTickPrice);
        currentPrice = nextTickPrice;
        input -= maxDx;
        if (pool.ticks[nextTickToCross].index % 2 === 0) {
          currentLiquidity -= pool.ticks[nextTickToCross].DLiquidity;
        } else {
          currentLiquidity += pool.ticks[nextTickToCross].DLiquidity;
        }
        nextTickToCross--;
      }
    } else {
      const maxDy = currentLiquidity * (nextTickPrice - currentPrice);
      //console.log('input, maxDy', input, maxDy);
      if (input <= maxDy) {
        output =
          input / currentPrice / (currentPrice + input / currentLiquidity);
        input = 0;
      } else {
        output =
          (currentLiquidity * (nextTickPrice - currentPrice)) /
          currentPrice /
          nextTickPrice;
        currentPrice = nextTickPrice;
        input -= maxDy;
        if (pool.ticks[nextTickToCross].index % 2 === 0) {
          currentLiquidity += pool.ticks[nextTickToCross].DLiquidity;
        } else {
          currentLiquidity -= pool.ticks[nextTickToCross].DLiquidity;
        }
        nextTickToCross++;
      }
    }

    outAmount += output * (1 - pool.fee);
    //console.log('out', outAmount);
  }

  return outAmount;
}

export function calcInByOut(
  pool: Pool,
  amountOut: number,
  direction: boolean
): number {
  let input = 0;
  const xBN = direction ? pool.reserve0 : pool.reserve1;
  const yBN = direction ? pool.reserve1 : pool.reserve0;
  switch (pool.type) {
    case PoolType.ConstantProduct: {
      const x = parseInt(xBN.toString());
      const y = parseInt(yBN.toString());
      input = (x * amountOut) / (1 - pool.fee) / (y - amountOut);
      break;
    }
    case PoolType.Weighted: {
      const x = parseInt(xBN.toString());
      const y = parseInt(yBN.toString());
      const wPool = pool as RWeightedPool;
      const weightRatio = direction
        ? wPool.weight0 / wPool.weight1
        : wPool.weight1 / wPool.weight0;
      input =
        x * (1 - pool.fee) * (Math.pow(1 - amountOut / y, -weightRatio) - 1);
      break;
    }
    case PoolType.Hybrid: {
      let yNewBN = yBN.sub(getBigNumber(undefined, amountOut));
      if (yNewBN.lt(1))
        // lack of precision
        yNewBN = BigNumber.from(1);

      const xNewBN = HybridgetY(pool as RHybridPool, yNewBN);
      input = Math.round(parseInt(xNewBN.sub(xBN).toString()) / (1 - pool.fee));

      // const yNew = y - amountOut;
      // const xNew = HybridgetY(pool, yNew);
      // input = (xNew - x)/(1-pool.fee);
      break;
    }
    default:
      console.error("Unknown pool type");
  }

  // ASSERT(() => {
  //   const amount2 = calcOutByIn(pool, input, direction);
  //   const res = closeValues(amountOut, amount2, 1e-6);
  //   if (!res) console.log("Error 138:", amountOut, amount2, Math.abs(amountOut/amount2 - 1));
  //   return res;
  // });
  if (input < 1) input = 1;
  return input;
}

export function calcPrice(
  pool: Pool,
  amountIn: number,
  takeFeeIntoAccount = true
): number {
  const r0 = parseInt(pool.reserve0.toString());
  const r1 = parseInt(pool.reserve1.toString());
  const oneMinusFee = takeFeeIntoAccount ? 1 - pool.fee : 1;
  switch (pool.type) {
    case PoolType.ConstantProduct: {
      const x = r0 / oneMinusFee;
      return (r1 * x) / (x + amountIn) / (x + amountIn);
    }
    case PoolType.Weighted: {
      const wPool = pool as RWeightedPool;
      const weightRatio = wPool.weight0 / wPool.weight1;
      const x = r0 + amountIn * oneMinusFee;
      return (
        (r1 * weightRatio * oneMinusFee * Math.pow(r0 / x, weightRatio)) / x
      );
    }
    case PoolType.Hybrid: {
      const hPool = pool as RHybridPool;
      const D = parseInt(HybridComputeLiquidity(hPool).toString());
      const A = hPool.A / A_PRECISION;
      const x = r0 + amountIn;
      const b = 4 * A * x + D - 4 * A * D;
      const ac4 = (D * D * D) / x;
      const Ds = Math.sqrt(b * b + 4 * A * ac4);
      const res = (0.5 - (2 * b - ac4 / x) / Ds / 4) * oneMinusFee;
      return res;
    }
  }
  return 0;
}

function calcInputByPriceConstantMean(pool: RWeightedPool, price: number) {
  const r0 = parseInt(pool.reserve0.toString());
  const r1 = parseInt(pool.reserve1.toString());
  const weightRatio = pool.weight0 / pool.weight1;
  const t =
    r1 * price * weightRatio * (1 - pool.fee) * Math.pow(r0, weightRatio);
  return (Math.pow(t, 1 / (weightRatio + 1)) - r0) / (1 - pool.fee);
}

export function calcInputByPrice(
  pool: Pool,
  priceEffective: number,
  hint = 1
): number {
  switch (pool.type) {
    case PoolType.ConstantProduct: {
      const r0 = parseInt(pool.reserve0.toString());
      const r1 = parseInt(pool.reserve1.toString());
      const x = r0 / (1 - pool.fee);
      const res = Math.sqrt(r1 * x * priceEffective) - x;
      return res;
    }
    case PoolType.Weighted: {
      const res = calcInputByPriceConstantMean(
        pool as RWeightedPool,
        priceEffective
      );
      return res;
    }
    case PoolType.Hybrid: {
      return revertPositive(
        (x: number) => 1 / calcPrice(pool, x),
        priceEffective,
        hint
      );
    }
  }
  return 0;
}

//================================= Utils ====================================

export function ASSERT(f: () => boolean, t?: string) {
  if (!f() && t) console.error(t);
}

export function closeValues(a: number, b: number, accuracy: number): boolean {
  if (accuracy === 0) return a === b;
  if (a < 1 / accuracy) return Math.abs(a - b) <= 10;
  return Math.abs(a / b - 1) < accuracy;
}

export function calcSquareEquation(
  a: number,
  b: number,
  c: number
): [number, number] {
  const D = b * b - 4 * a * c;
  console.assert(D >= 0, `Discriminant is negative! ${a} ${b} ${c}`);
  const sqrtD = Math.sqrt(D);
  return [(-b - sqrtD) / 2 / a, (-b + sqrtD) / 2 / a];
}

// returns such x > 0 that f(x) = out or 0 if there is no such x or f defined not everywhere
// hint - approximation of x to spead up the algorithm
// f assumed to be continues monotone growth function defined everywhere
export function revertPositive(
  f: (x: number) => number,
  out: number,
  hint = 1
) {
  try {
    if (out <= f(0)) return 0;
    let min, max;
    if (f(hint) > out) {
      min = hint / 2;
      while (f(min) > out) min /= 2;
      max = min * 2;
    } else {
      max = hint * 2;
      while (f(max) < out) max *= 2;
      min = max / 2;
    }

    while (max / min - 1 > 1e-4) {
      const x0: number = (min + max) / 2;
      const y0 = f(x0);
      if (out === y0) return x0;
      if (out < y0) max = x0;
      else min = x0;
    }
    return (min + max) / 2;
  } catch (e) {
    return 0;
  }
}

export function getBigNumber(
  valueBN: BigNumber | undefined,
  value: number
): BigNumber {
  if (valueBN !== undefined) return valueBN;

  if (value < Number.MAX_SAFE_INTEGER) return BigNumber.from(Math.round(value));

  const exp = Math.floor(Math.log(value) / Math.LN2);
  console.assert(exp >= 51, "Internal Error 314");
  const shift = exp - 51;
  const mant = Math.round(value / Math.pow(2, shift));
  const res = BigNumber.from(mant).mul(BigNumber.from(2).pow(shift));
  return res;
}
