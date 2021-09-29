import { ConstantProductRPool } from "../src/PrimaryPools"
import { getBigNumber } from "../src/Utils"
import { ParallelCPRPool } from "../src/ParallelCPRPool"
import { findMultiRouting } from "../src";
import seedrandom from "seedrandom";

const testSeed = "0"; // Change it to change random generator values
const rnd: () => number = seedrandom(testSeed); // random [0, 1)

function getRandom(rnd: () => number, min: number, max: number) {
  const minL = Math.log(min)
  const maxL = Math.log(max)
  const v = rnd() * (maxL - minL) + minL
  const res = Math.exp(v)
  console.assert(res <= max && res >= min, 'Random value is out of the range')
  return res
}

const gasPrice = 200

describe('Parallel ConstuntProduct Combo Pool', () => {
  it('One pool', () => {
    const token0 = {name: 'Token0', address: 'Token0Address'}
    const token1 = {name: 'Token1', address: 'Token1Address'}
    const pool = new ConstantProductRPool(
        'poolAddress',
        token0,
        token1,
        0.003,
        getBigNumber(1e18),
        getBigNumber(2e18)
    )
    const comboPool1 = new ParallelCPRPool(token0, [pool], gasPrice)

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool1.calcOutByIn(amountIn, true)[0]
      const out2 = findMultiRouting(token0, token1, amountIn, [pool], token1, gasPrice).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool1.calcOutByIn(amountIn, false)[0]
      const out2 = findMultiRouting(token1, token0, amountIn, [pool], token1, gasPrice).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }

    const comboPool2 = new ParallelCPRPool(token1, [pool], gasPrice)

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool2.calcOutByIn(amountIn, false)[0]
      const out2 = findMultiRouting(token0, token1, amountIn, [pool], token1, gasPrice).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool2.calcOutByIn(amountIn, true)[0]
      const out2 = findMultiRouting(token1, token0, amountIn, [pool], token1, gasPrice).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }
  })

  it('Several equal pools', () => {
    const token0 = {name: 'Token0', address: 'Token0Address'}
    const token1 = {name: 'Token1', address: 'Token1Address'}
    const pools = []
    for (let i = 0; i < 7; ++i) {
      pools.push(new ConstantProductRPool(
        'poolAddress',
        token0,
        token1,
        0.003,
        getBigNumber(1e18),
        getBigNumber(2e18)
      ))
      const comboPool = new ParallelCPRPool(token0, pools, gasPrice)

      for (let i = 0; i < 100; ++i) {
        const amountIn = getRandom(rnd, 1e3, 1e20)
        const [out1, gas] = comboPool.calcOutByIn(amountIn, true)
        const ta = out1 - gas*gasPrice
        const {amountOut, totalAmountOut} = findMultiRouting(token0, token1, amountIn, pools, token1, gasPrice)
        expect(amountOut).toBeLessThanOrEqual(out1*(1+1e-12))
        expect(totalAmountOut).toBeLessThanOrEqual(ta > 0 ? ta*(1+1e-12):ta*(1-1e-12))
      }
    }    
  })
})