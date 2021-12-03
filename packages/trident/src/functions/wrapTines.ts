import { BigNumber } from "@ethersproject/bignumber";
import { Token } from "@sushiswap/core-sdk";
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
import { IPool } from "src";

function convertIPooltoRPool(pool: IPool): RPool {
  return new ConstantProductRPool(
    pool.liquidityToken.address,
    pool.assets[0].wrapped as RToken,
    pool.assets[1].wrapped as RToken,
    pool.fee / 10000,
    BigNumber.from(pool.reserves[0].quotient.toString()),
    BigNumber.from(pool.reserves[1].quotient.toString())
  )
}

export function findMultiRouteExactIn(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: IPool[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindMultiRouteExactIn(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertIPooltoRPool),
    baseToken as RToken,
    gasPrice
  )
}

export function findMultiRouteExactOut(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: IPool[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindMultiRouteExactOut(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertIPooltoRPool),
    baseToken as RToken,
    gasPrice
  )
}

export function findSingleRouteExactIn(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: IPool[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindSingleRouteExactIn(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertIPooltoRPool),
    baseToken as RToken,
    gasPrice
  )
}

export function findSingleRouteExactOut(
  from: Token,
  to: Token,
  amountIn: BigNumber | number,
  pools: IPool[],
  baseToken: Token,
  gasPrice: number
): MultiRoute {
  return TinesFindSingleRouteExactOut(
    from as RToken,
    to as RToken,
    amountIn,
    pools.map(convertIPooltoRPool),
    baseToken as RToken,
    gasPrice
  )
}