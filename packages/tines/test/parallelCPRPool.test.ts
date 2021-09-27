import { ConstantProductRPool } from "../src/PrimaryPools"
import { getBigNumber } from "../src/Utils"
import { ParallelCPRPool } from "../src/ParallelCPRPool"
import seedrandom from "seedrandom";
import { findMultiRouting } from "../src";

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
    const comboPool1 = new ParallelCPRPool(token0, [pool], 200)

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool1.calcOutByIn(amountIn, true)[0]
      const out2 = findMultiRouting(token0, token1, amountIn, [pool], token1, 200).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool1.calcOutByIn(amountIn, false)[0]
      const out2 = findMultiRouting(token1, token0, amountIn, [pool], token1, 200).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }

    const comboPool2 = new ParallelCPRPool(token1, [pool], 200)

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool2.calcOutByIn(amountIn, false)[0]
      const out2 = findMultiRouting(token0, token1, amountIn, [pool], token1, 200).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }

    for (let i = 0; i < 10; ++i) {
      const amountIn = getRandom(rnd, 1e3, 1e17)
      const out1 = comboPool2.calcOutByIn(amountIn, true)[0]
      const out2 = findMultiRouting(token1, token0, amountIn, [pool], token1, 200).amountOut
      expect(Math.abs(out1/out2-1)).toBeLessThan(1e-12)
    }
  })
})