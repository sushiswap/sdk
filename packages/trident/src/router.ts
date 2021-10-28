import { Percent, CurrencyAmount, Currency, validateAndParseAddress, TradeType } from '@sushiswap/core-sdk'
import { Trade } from './entities/Trade'
import invariant from 'tiny-invariant'
import { RouteLeg } from '@sushiswap/tines'

/**
 * Options for producing the arguments to send call to the router.
 */
export interface TradeOptions {
  /**
   * How much the execution price is allowed to move unfavorably from the trade execution price.
   */
  allowedSlippage: Percent
  /**
   * The account that should receive the output of the swap.
   */
  recipient: string
}

/**
 * The parameters to use in the call to the Uniswap V2 Router to execute a trade.
 */
export interface SwapParameters {
  /**
   * The method to call on the Uniswap V2 Router.
   */
  methodName: string
  /**
   * The arguments to pass to the method, all hex encoded.
   */
  args: (string | string[])[]
  /**
   * The amount of wei to send in hex.
   */
  value: string
}

export function toHex(currencyAmount: CurrencyAmount<Currency>) {
  return `0x${currencyAmount.quotient.toString(16)}`
}

const ZERO_HEX = '0x0'

/**
 * Represents the Trident Router, and has static methods for helping execute trades.
 */
export abstract class Router {
  /**
   * Cannot be constructed.
   */
  private constructor() {}

  // public type(route: MultiRoute) { 
  //   if(route.legs.length === 1){
  //     return RouteType.SinglePool;
  //   }
  
  //   const routeInputTokens = multiRoute.legs.map(function (leg) { return leg.tokenFrom.address});
  
  //   if((new Set(routeInputTokens)).size === routeInputTokens.length){
  //     return RouteType.SinglePath;
  //   }
  
  //   if((new Set(routeInputTokens)).size !== routeInputTokens.length){
  //     return RouteType.ComplexPath;
  //   }
  
  //   return "unknown";
  // } 

  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static swapCallParameters(trade: Trade<Currency, Currency, TradeType>, options: TradeOptions): SwapParameters {
    const nativeIn = trade.inputAmount.currency.isNative
    const nativeOut = trade.outputAmount.currency.isNative
    // the router does not support both native in and out
    invariant(!(nativeIn && nativeOut), 'NATIVE_IN_OUT')

    const to: string = validateAndParseAddress(options.recipient)
    const amountIn: string = toHex(trade.inputAmount)
    const amountOut: string = toHex(trade.minimumAmountOut(options.allowedSlippage))
    const path: string[] = trade.route.legs.map((leg: RouteLeg) => leg.token.address)

    let methodName: string
    let args: (string | string[])[]
    let value: string
    if (nativeIn) {
      methodName = 'swapExactETHForTokens'
      // (uint amountOutMin, address[] calldata path, address to, uint deadline)
      args = [amountOut, path, to]
      value = amountIn
    } else if (nativeOut) {
      methodName = 'swapExactTokensForETH'
      // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
      args = [amountIn, amountOut, path, to]
      value = ZERO_HEX
    } else {
      methodName = 'swapExactTokensForTokens'
      // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
      args = [amountIn, amountOut, path, to]
      value = ZERO_HEX
    }
    return {
      methodName,
      args,
      value,
    }
  }
}
