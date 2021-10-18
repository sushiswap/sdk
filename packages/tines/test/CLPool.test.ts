import { BigNumber } from '@ethersproject/bignumber'
import seedrandom from 'seedrandom';
import {CLRPool, CLTick, CL_MAX_TICK, CL_MIN_TICK} from '../src'

const testSeed = "2"; // Change it to change random generator values
const rnd: () => number = seedrandom(testSeed); // random [0, 1)

export function getRandomLin(rnd: () => number, min: number, max: number) {
  return rnd()*(max-min) + min
}

export function getRandomExp(rnd: () => number, min: number, max: number) {
  const minL = Math.log(min)
  const maxL = Math.log(max)
  const v = rnd() * (maxL - minL) + minL
  const res = Math.exp(v)
  console.assert(res <= max && res >= min, 'Random value is out of the range')
  return res
}

function addTick(ticks: CLTick[], index: number, L: number) {
  let fromIndex = ticks.findIndex(t => t.index >= index)
  if (fromIndex === -1) {
    ticks.push({index, DLiquidity: L})
  } else {
    if (ticks[fromIndex].index === index) {
      ticks[fromIndex].DLiquidity += L
    } else {
      ticks.splice(fromIndex, 0, {index, DLiquidity: L})
    }
  }
}

function addLiquidity(pool: CLRPool, from: number, to: number, L: number) {
  console.assert(from >= CL_MIN_TICK && from < to && to <= CL_MAX_TICK)
  console.assert(from%2 === 0 && to%2 !== 0, `${from} - ${to}`)
  console.assert(L >= 0)
  addTick(pool.ticks, from, L)
  addTick(pool.ticks, to, L)
}

function getTickPrice(pool: CLRPool, tick: number): number {
  return Math.sqrt(Math.pow(1.0001, pool.ticks[tick].index))
}

function getTickLiquidity(pool: CLRPool, tick: number): number {
  let L = 0
  for (let i = 0; i <= tick; ++i) {
    if (pool.ticks[i].index % 2 === 0) {
      L += pool.ticks[i].DLiquidity
    } else {
      L -= pool.ticks[i].DLiquidity
    }
  }
  return L
}

function getRandomCLPool(rnd: () => number, rangeNumber: number, minLiquidity: number, maxLiquidity: number): CLRPool {
  const pool = new CLRPool(
    'CLRPool',
    {name: 'Token0', address: 'Token0'},
    {name: 'Token1', address: 'Token1'},
    0.003,
    BigNumber.from(0),
    BigNumber.from(0),
    0,
    1,
    -1,
    []
  )

  for (let i = 0; i < rangeNumber; ++i) {
    const tick1 = Math.floor(getRandomLin(rnd, CL_MIN_TICK, CL_MAX_TICK + 1))
    const tick2 = Math.floor(getRandomLin(rnd, CL_MIN_TICK, CL_MAX_TICK + 1))
    const low = Math.min(tick1, tick2)>>1<<1
    const high = (Math.max(tick1, tick2)>>1<<1) + 1
    const liquidity = getRandomExp(rnd, minLiquidity, maxLiquidity)
    addLiquidity(pool, low, high, liquidity)
  }

  pool.nearestTick = Math.floor(getRandomLin(rnd, 0, pool.ticks.length-1))
  const tickPrice = getTickPrice(pool, pool.nearestTick)
  const nextTickPrice = getTickPrice(pool, pool.nearestTick+1)
  pool.sqrtPrice = getRandomLin(rnd, tickPrice, nextTickPrice)
  pool.liquidity = getTickLiquidity(pool, pool.nearestTick)

  return pool
}

function getMaxInputApprox(pool: CLRPool, direction: boolean): number {
  let prevOutput = -1;
  let input = 10;
  while(1) {
    const output = pool.calcOutByIn(input, direction).out
    if (output === prevOutput) {
      return input/2
    }
    input *= 2
    prevOutput = output
  }
  return -1
}

describe('CL pool test', () => {
  it('0->0', () => {
    const pool = getRandomCLPool(rnd, 2, 100, 1e10)
    expect(pool.calcOutByIn(0, true).out).toEqual(0)
    expect(pool.calcOutByIn(0, false).out).toEqual(0)
    expect(pool.calcInByOut(0, true).inp).toEqual(0)
    expect(pool.calcInByOut(0, false).inp).toEqual(0)
  })

  it('in->out->in2 = in', () => {
    const calcTestNumber = 100
    for (let p = 0; p < 1; ++p) {
      const pool = getRandomCLPool(rnd, 2, 100, 1e6)
      const maxXInput = getMaxInputApprox(pool, true)
      const maxYInput = getMaxInputApprox(pool, false)
      //console.log(pool.ticks, pool.nearestTick, pool.sqrtPrice, maxXInput, maxYInput)
      let xLiquidityOverflow = 0, yLiquidityOverflow = 0
      for (let i = 0; i < calcTestNumber; ++i) {
        const direction = rnd() > 0.5
        const maxInput = direction ? maxXInput : maxYInput
        const input = getRandomExp(rnd, 1, maxInput * 1.2)
        const output = pool.calcOutByIn(input, direction).out
        const input2 = pool.calcInByOut(output, direction).inp
        const precision = Math.abs(input/input2 - 1)
        if (precision > 1e-7) {
          const output3 = pool.calcOutByIn(input * 1.1, direction).out
          // if (output !== output3) {
          //   console.log(input, output, input2, precision);
          // }
          expect(output).toEqual(output3) // pool overflow
          if (direction) {
            xLiquidityOverflow++
          } else {
            yLiquidityOverflow++
          }
        }
      }
      expect(xLiquidityOverflow).toBeGreaterThan(0)   // otherwise not much enough input was used for testing
      expect(yLiquidityOverflow).toBeGreaterThan(0)   // otherwise not much enough input was used for testing
      //console.log(maxXInput, maxYInput, xLiquidityOverflow/calcTestNumber, yLiquidityOverflow/calcTestNumber);
    }
  })
})