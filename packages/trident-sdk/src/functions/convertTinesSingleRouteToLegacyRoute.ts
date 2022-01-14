import { Currency, Pair, Route } from '@sushiswap/core-sdk'
import {

  MultiRoute,

} from '@sushiswap/tines'

export function convertTinesSingleRouteToLegacyRoute<TInput extends Currency, TOutput extends Currency>(
  route: MultiRoute,
  allPairs: Pair[],
  input: TInput,
  output: TOutput
): Route<TInput, TOutput> {
  const pairHash = new Map<string, Pair>()
  allPairs.forEach((p) => pairHash.set(p.liquidityToken.address, p))
  const pairs = route.legs.map((l) => {
    const pair = pairHash.get(l.poolAddress)
    if (pair === undefined) {
      throw new Error('Internal Error 119')
    }
    return pair
  })
  return new Route(pairs, input, output)
}
