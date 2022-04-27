import { BigNumber } from "@ethersproject/bignumber"
import { getBigNumber, StableSwapRPool, closeValues } from "../src"

const token0 = {
  name: "Token0",
  "address": "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede"
}
const token1 = {
  name: "Token1",
  "address": "0xd0A1E359811322d97991E03f863a0C30C2cF029C"
}
const v = BigNumber.from("0x76329851304572304587")  // random number  ~ 2^80

function createPool(amountX: BigNumber, amountY: BigNumber, fee = 0.003) {
  return new StableSwapRPool(
    "0x253029F0D3593Afd4187500F1CB243F1EceaABAB",
    token0,
    token1,
    fee,
    amountX,
    amountY
  )
}

function checkCurveInvariant(pool: StableSwapRPool, amountIn: number, amountOut: number, direction: boolean) {
  const prev_y = parseFloat((direction ? pool.reserve1 : pool.reserve0).toString())
  if (prev_y < amountOut*(1+1e-12)) 
    return true   // precision doens't allow to make the check -- too big swap

  const k = pool.computeK()
  const amountInWithoutFee = amountIn*(1-pool.fee)
  const x = (direction ? pool.reserve0 : pool.reserve1).add(getBigNumber(amountInWithoutFee))
  const y = (direction ? pool.reserve1 : pool.reserve0).sub(getBigNumber(amountOut))

  const new_k = x.mul(y).mul( x.mul(x).add(y.mul(y)) )
  const diff = new_k.sub(k).abs()
  if (diff.isZero()) return true
  const relative_diff = k.div(diff)
  // if (relative_diff.lt(1e12))
  //   console.log(k.toString(), new_k.toString(), relative_diff.toString())//, diff.toString());
  return relative_diff.gt(1e12)
}

function checkSwap(pool: StableSwapRPool, amountIn: number, direction: boolean): number {
  const {out, gasSpent} = pool.calcOutByIn(amountIn, direction)
  
  expect(gasSpent).toBeDefined()
  expect(gasSpent).not.toBeNaN()
  expect(gasSpent).toBeGreaterThan(0)
  
  expect(out).toBeDefined()
  expect(out).not.toBeNaN()
  expect(out).toBeGreaterThanOrEqual(0)
  expect(checkCurveInvariant(pool, amountIn, out, direction)).toBeTruthy()
  
  const {inp, gasSpent: gasSpent2} = pool.calcInByOut(out, direction)
  
  expect(gasSpent2).toBeDefined()
  expect(gasSpent2).not.toBeNaN()
  expect(gasSpent2).toBeGreaterThan(0)

  expect(inp).toBeDefined()
  expect(inp).not.toBeNaN()
  expect(inp).toBeGreaterThanOrEqual(0)

  const prev_y = parseFloat((direction ? pool.reserve1 : pool.reserve0).toString())
  if (prev_y > out*(1+1e-12)) // else precision doens't allow to make the check -- too big swap
    expect(closeValues(inp, amountIn, 1e-12)).toBeTruthy()

  return out
}

describe("StableSwap test", () => {
  describe("calcOutByIn & calcInByOut", () => {
    it('Ideal balance, regular values', () => {
      const pool = createPool(v, v)
      for (let i = 0; i < 100; ++i) {
        const amountIn = 1e18*i
        const out1 = checkSwap(pool, amountIn, true)
        const out2 = checkSwap(pool, amountIn, false)

        expect(out1).toEqual(out2)
        expect(out1).toBeLessThanOrEqual(amountIn*0.997)
      }
    })
    it('Small disbalance, regular values', () => {
      const pool = createPool(v.add(v.div(10)), v)
      for (let i = 0; i < 100; ++i) {
        const amountIn = 1e18*i
        const out1 = checkSwap(pool, amountIn, true)
        const out2 = checkSwap(pool, amountIn, false)

        expect(out1).toBeLessThanOrEqual(out2)
      }
    })
    it('Big disbalance, regular values', () => {
      const pool = createPool(v.mul(1e6), v)
      for (let i = 0; i < 100; ++i) {        
        const amountIn = 1e18*i
        const out1 = checkSwap(pool, amountIn, true)
        const out2 = checkSwap(pool, amountIn, false)

        expect(out1).toBeLessThanOrEqual(out2)
      }
    })
    it('Ideal balance, huge swap values', () => {
      const pool = createPool(v, v)

      const vNumber = parseFloat(v.toString())
      for (let i = 0; i < 100; ++i) {
        const amountIn = 1e28*i
        const out1 = checkSwap(pool, amountIn, true)
        const out2 = checkSwap(pool, amountIn, false)

        expect(out1).toEqual(out2)
        expect(out1).toBeLessThanOrEqual(vNumber)
      }
    })
  })

// TODO: add check price with the help of calcOutByIn function
  describe("Price calculation", () => {
    it('Regular values', () => {    
      let prev_price1 = Number.MAX_VALUE, prev_price2 = 0
      for (let i = 1; i < 100; ++i) {
        const pool = createPool(v.mul(i), v.mul(100-i))

        const price1 = pool.calcCurrentPriceWithoutFee(true)
        const price2 = pool.calcCurrentPriceWithoutFee(false)
        expect(price2).toBeDefined()
        expect(price2).toBeDefined()
        expect(price1).not.toBeNaN()
        expect(price2).not.toBeNaN()
        expect(price1).toBeGreaterThan(0)
        expect(price2).toBeGreaterThan(0)
        if (i < 50) {
          expect(price1).toBeGreaterThan(1)
          expect(price2).toBeLessThan(1)
        } 
        if (i > 50) {
          expect(price2).toBeGreaterThan(1)
          expect(price1).toBeLessThan(1)
        } 
        if (i == 50) {
          expect(Math.abs(price1-1)).toBeLessThan(1e-9)
          expect(Math.abs(price2-1)).toBeLessThan(1e-9)
        }
        expect(price1).toBeLessThan(prev_price1)
        expect(price2).toBeGreaterThan(prev_price2)
        expect(Math.abs(price1*price2-1)).toBeLessThan(1e-9)
        prev_price1 = price1
        prev_price2 = price2
      }
    })

    it('Extreme low balance', () => {    
      const low_v = BigNumber.from("100")
      let prev_price1 = Number.MAX_VALUE, prev_price2 = 0
      for (let i = 1; i < 100; ++i) {
        const pool = createPool(low_v.mul(i), low_v.mul(100-i))

        const price1 = pool.calcCurrentPriceWithoutFee(true)
        const price2 = pool.calcCurrentPriceWithoutFee(false)
        
        expect(price2).toBeDefined()
        expect(price2).toBeDefined()
        expect(price1).not.toBeNaN()
        expect(price2).not.toBeNaN()
        expect(price1).toBeGreaterThan(0)
        expect(price2).toBeGreaterThan(0)
        if (i < 50) {
          expect(price1).toBeGreaterThan(1)
          expect(price2).toBeLessThan(1)
        } 
        if (i > 50) {
          expect(price2).toBeGreaterThan(1)
          expect(price1).toBeLessThan(1)
        } 
        if (i == 50) {
          expect(Math.abs(price1-1)).toBeLessThan(1e-9)
          expect(Math.abs(price2-1)).toBeLessThan(1e-9)
        }
        expect(price1).toBeLessThan(prev_price1)
        expect(price2).toBeGreaterThan(prev_price2)
        expect(Math.abs(price1*price2-1)).toBeLessThan(1e-9)
        prev_price1 = price1
        prev_price2 = price2
      }
    })

    it('Extreme disproportion', () => {
      let prev_price1 = Number.MAX_VALUE, prev_price2 = 0
      for (let i = 1; i < 100; ++i) {
        const pool = createPool(v.mul(i), v.mul(1e9-i))

        const price1 = pool.calcCurrentPriceWithoutFee(true)
        const price2 = pool.calcCurrentPriceWithoutFee(false)
        
        expect(price1).toBeDefined()
        expect(price2).toBeDefined()
        expect(price1).not.toBeNaN()
        expect(price2).not.toBeNaN()
        expect(price1).toBeGreaterThan(0)
        expect(price2).toBeGreaterThan(0)
        expect(price1).toBeGreaterThan(1)
        expect(price2).toBeLessThan(1)
        expect(price1).toBeLessThan(prev_price1)
        expect(price2).toBeGreaterThan(prev_price2)
        expect(Math.abs(price1*price2-1)).toBeLessThan(1e-9)
        prev_price1 = price1
        prev_price2 = price2
      }
    })
  })
})