import { BigNumber } from "@ethersproject/bignumber";
import { Pair, Token } from "@sushiswap/core-sdk";
import {
  ConstantProductRPool, 
  findMultiRouteExactIn as TinesFindMultiRouteExactIn, 
  findMultiRouteExactOut as TinesFindMultiRouteExactOut, 
  findSingleRouteExactIn as TinesFindSingleRouteExactIn, 
  findSingleRouteExactOut as TinesFindSingleRouteExactOut, 
  MultiRoute, 
  RPool, 
  RToken
} from "@sushiswap/tines"
import { ConstantProductPool, Pool } from "../entities";
import { Fee } from "../enums";

function convertPoolOrPairtoRPool(pool: Pool | Pair): RPool {
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