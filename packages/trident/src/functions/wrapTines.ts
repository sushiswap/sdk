import { BigNumber } from "@ethersproject/bignumber";
import { Currency, Pair, Price, Route, Token } from "@sushiswap/core-sdk";
import {
  ConstantProductRPool, 
  findMultiRouteExactIn as TinesFindMultiRouteExactIn, 
  findMultiRouteExactOut as TinesFindMultiRouteExactOut, 
  findSingleRouteExactIn as TinesFindSingleRouteExactIn, 
  findSingleRouteExactOut as TinesFindSingleRouteExactOut, 
  calcTokenPrices as TinesCalcTokenPrices,
  MultiRoute, 
  RPool, 
  RToken
} from "@sushiswap/tines"
import { Pool } from "../entities/Pool";
import { ConstantProductPool } from "../entities/ConstantProductPool";
import { Fee } from "../enums";

export function convertPoolOrPairtoRPool(pool: Pool | Pair): RPool {
  if (pool instanceof ConstantProductPool) {
    return new ConstantProductRPool(
      pool.liquidityToken.address,
      pool.assets[0].wrapped as RToken,
      pool.assets[1].wrapped as RToken,
      pool.fee / 10000,
      BigNumber.from(pool.reserves[0].quotient.toString()),
      BigNumber.from(pool.reserves[1].quotient.toString())
    )
  } else if (pool instanceof Pair) {
    return new ConstantProductRPool(
      pool.liquidityToken.address,
      pool.token0 as RToken,
      pool.token1 as RToken,
      Fee.DEFAULT / 10000,
      BigNumber.from(pool.reserve0.quotient.toString()),
      BigNumber.from(pool.reserve1.quotient.toString())
    )
  } else {
    throw new Error("Unsupported type of pool !!!")
  }
}

export function findMultiRouteExactIn(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: (Pool | Pair)[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindMultiRouteExactIn(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertPoolOrPairtoRPool),
    baseToken as RToken,
    gasPrice
  )
}

export function findMultiRouteExactOut(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: (Pool | Pair)[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindMultiRouteExactOut(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertPoolOrPairtoRPool),
    baseToken as RToken,
    gasPrice
  )
}

export function findSingleRouteExactIn(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: (Pool | Pair)[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindSingleRouteExactIn(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertPoolOrPairtoRPool),
    baseToken as RToken,
    gasPrice
  )
}

export function findSingleRouteExactOut(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: (Pool | Pair)[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindSingleRouteExactOut(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertPoolOrPairtoRPool),
    baseToken as RToken,
    gasPrice
  )
}

export function convertTinesSingleRouteToLegacyRoute<TInput extends Currency, TOutput extends Currency>(
  route: MultiRoute,
  allPairs: Pair[], 
  input: TInput, 
  output: TOutput
): Route<TInput, TOutput> {
  const pairHash = new Map<string, Pair>()
  allPairs.forEach(p => pairHash.set(p.liquidityToken.address, p))
  const pairs = route.legs.map(l => {
    const pair = pairHash.get(l.poolAddress)
    if (pair === undefined) {
      throw new Error('Internal Error 119')
    }
    return pair
  })
  return new Route(pairs, input, output)
}

export function calcTokenPrices<T extends Token>(pools: (Pool | Pair)[], baseToken: T): Record<string, Price<Token, T>> {
  const map: Map<RToken, number> = TinesCalcTokenPrices(pools.map(convertPoolOrPairtoRPool), baseToken as RToken)
  const res: Record<string, Price<Token, T>> = {}
  Array.from(map.entries()).forEach(
    ([token, price]) => res[token.address] = new Price(token as Token, baseToken, 1e18, Math.round(price*1e18))
  )
  return res
}