import { BigNumber } from "@ethersproject/bignumber";
import { checkRouteResult } from "./snapshots/snapshot";
import { findMultiRouting, RouteStatus } from "../src/MultiRouter";
import { RToken, ConstantProductRPool } from "../src/PrimaryPools";

const gasPrice = 1 * 200 * 1e-9

// Bridge:
//   /1\
// -0 | 3-
//   \2/

function getPool(
  tokens: RToken[],
  t0: number,
  t1: number,
  price: number[],
  reserve: number,
  fee = 0.003,
  imbalance = 0
) {
  return new ConstantProductRPool(
    `pool-${t0}-${t1}-${reserve}-${fee}`,
    tokens[t0],
    tokens[t1],
    fee,
    BigNumber.from(reserve),
    BigNumber.from(
      Math.round(reserve / (price[t1] / price[t0]) - imbalance)
    ),
  );
}

// ====================== Env 1 ==================
const price = [1, 1, 1, 1, 1]
const tokens = price.map((_, i) => ({
  name: '' + (i + 1),
  address: 'token_addres ' + (i+1),
}))

const testPool0_1 = getPool(tokens, 0, 1, price, 1_500_0)
const testPool0_2 = getPool(tokens, 0, 2, price, 1_000_0)
const testPool1_2 = getPool(tokens, 1, 2, price, 1_000_000_000)
const testPool1_3 = getPool(tokens, 1, 3, price, 1_000_0)
const testPool2_3 = getPool(tokens, 2, 3, price, 1_500_0)

const testPools = [testPool0_1, testPool0_2, testPool1_3, testPool2_3, testPool1_2]

// ======================= Env2 ===================
const price2 = [1, 2, 2.2, 15, 0.01]
const tokens2 = price2.map((_, i) => ({
  name: '' + (i + 1),
  address: 'token_addres ' + (i+1),
}))

const testPool0_1_2 = getPool(tokens2, 0, 1, price2, 1_500_0)
const testPool0_2_2 = getPool(tokens2, 0, 2, price2, 1_000_00)
const testPool1_2_2 = getPool(tokens2, 1, 2, price2, 1_000_000_000)
const testPool1_3_2 = getPool(tokens2, 1, 3, price2, 800_00)
const testPool2_3_2 = getPool(tokens2, 2, 3, price2, 1_500_0)

const testPools2 = [testPool0_1_2, testPool0_2_2, testPool1_3_2, testPool2_3_2, testPool1_2_2]

describe('Multirouting for bridge topology', () => {
  it('works correct for equal prices', () => {
    const res = findMultiRouting(tokens[0], tokens[3], 10000, testPools, tokens[2], gasPrice, 100)

    expect(res).toBeDefined()
    expect(res?.status).toEqual(RouteStatus.Success)
    expect(res?.legs.length).toEqual(testPools.length)
    expect(res?.legs[res.legs.length - 1].swapPortion).toEqual(1)

    checkRouteResult('bridge-1', res.totalAmountOut)
  })

  it('unknown gas price', () => {
    const res = findMultiRouting(tokens[0], tokens[3], 20000, testPools, tokens[4], gasPrice, 100)

    expect(res).toBeDefined()
    expect(res?.status).toEqual(RouteStatus.Success)
    expect(res?.legs.length).toEqual(testPools.length)
    expect(res?.legs[res.legs.length - 1].swapPortion).toEqual(1)

    checkRouteResult('bridge-2', res.totalAmountOut)
  })

  it('not connected tokens', () => {
    const res = findMultiRouting(tokens[0], tokens[4], 20000, testPools, tokens[2], gasPrice, 100)

    expect(res).toBeDefined()
    expect(res?.status).toEqual(RouteStatus.NoWay)
  })

  it('partial routing', () => {
    // Try to route too big value => all pools achive min liquidity => no routing any more
    const res = findMultiRouting(tokens[0], tokens[3], 1000000, testPools, tokens[2], gasPrice, 100)

    expect(res).toBeDefined()
    expect(res?.status).toEqual(RouteStatus.Partial)
    expect(res?.legs.length).toEqual(testPools.length)
    expect(res?.legs[res.legs.length - 1].swapPortion).toEqual(1)

    checkRouteResult('bridge-3', res.totalAmountOut)
  })

  it('Special case for _one_line_ coverage', () => {
    const res = findMultiRouting(
      tokens[0],
      tokens[3],
      10000,
      testPools,
      tokens[2],
      gasPrice,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
    )

    expect(res).toBeDefined()
    expect(res?.status).toEqual(RouteStatus.Success)
    expect(res?.legs[res.legs.length - 1].swapPortion).toEqual(1)

    checkRouteResult('bridge-4', res.totalAmountOut)
  })

  it('Varios step number check', () => {
    const steps = [1, 2, 3, 5, 10, 30, 100, 300, 1000]
    steps.forEach((s) => {
      const res = findMultiRouting(tokens[0], tokens[3], 10000, testPools, tokens[2], gasPrice, s)
      //console.log(s, res?.amountOut);
      expect(res).toBeDefined()
      expect(res?.status).toEqual(RouteStatus.Success)
      expect(res?.legs[res.legs.length - 1].swapPortion).toEqual(1)

      checkRouteResult('bridge-5-' + s, res.totalAmountOut)
    })
  })

  it('works correct for not equal prices', () => {
    const res = findMultiRouting(tokens2[0], tokens2[3], 10000, testPools2, tokens2[2], gasPrice, 100)

    expect(res).toBeDefined()
    expect(res?.status).toEqual(RouteStatus.Success)
    expect(res?.legs.length).toEqual(testPools.length)
    expect(res?.legs[res.legs.length - 1].swapPortion).toEqual(1)

    checkRouteResult('bridge-6', res.totalAmountOut)
  })

  it('Varios step number check for not equal prices', () => {
    const steps = [1, 2, 3, 5, 10, 30, 100, 300, 1000]
    steps.forEach((s) => {
      const res = findMultiRouting(tokens2[0], tokens2[3], 10000, testPools2, tokens2[2], gasPrice, s)
      //console.log(s, res?.amountOut);
      expect(res).toBeDefined()
      expect(res?.status).toEqual(RouteStatus.Success)
      expect(res?.legs[res.legs.length - 1].swapPortion).toEqual(1)

      checkRouteResult('bridge-7-' + s, res.totalAmountOut)
    })
  })
})
