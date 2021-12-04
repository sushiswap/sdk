import {
  Currency,
  CurrencyAmount,
  Percent,
  Price,
  TradeType,
  TradeVersion,
  ZERO,
  JSBI,
  Fraction,
  ONE,
} from '@sushiswap/core-sdk'
import { MultiRoute, RToken } from '@sushiswap/tines'
import invariant from 'tiny-invariant'

/**
 * Represents a trade executed against a list of pools.
 * Does not account for slippage, i.e. trades that front run this trade and move the price.
 */
export class Trade<
  TInput extends Currency,
  TOutput extends Currency,
  TTradeType extends TradeType,
  TTradeVersion extends TradeVersion
> {
  /**
   * The route of the trade, i.e. which pools the trade goes through and the input/output currencies.
   */
  public readonly route: MultiRoute

  /**
   * The type of the trade, either exact in or exact out.
   */
  public readonly tradeType: TTradeType

  /**
   * The version of the trade, either legacy or trident.
   */
  public readonly tradeVersion: TTradeVersion

  /**
   * The input amount for the trade assuming no slippage.
   */
  public readonly inputAmount: CurrencyAmount<TInput>
  /**
   * The output amount for the trade assuming no slippage.
   */
  public readonly outputAmount: CurrencyAmount<TOutput>

  /**
   * The price expressed in terms of output amount/input amount.
   */
  public readonly executionPrice: Price<TInput, TOutput>

  /**
   * Constructs an exact in trade with the given amount in and route
   * @param route route of the exact in trade
   * @param tradeVersion the version of the trade
   */
  public static exactIn<TInput extends Currency, TOutput extends Currency, TTradeVersion extends TradeVersion>(
    route: MultiRoute,
    tradeVersion?: TTradeVersion
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT, TTradeVersion> {
    return new Trade(route, TradeType.EXACT_INPUT, tradeVersion)
  }

  /**
   * Constructs an exact out trade with the given amount out and route
   * @param route route of the exact out trade
   * @param tradeVersion the version of the trade
   */
  public static exactOut<TInput extends Currency, TOutput extends Currency, TTradeVersion extends TradeVersion>(
    route: MultiRoute,
    tradeVersion?: TTradeVersion
  ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT, TTradeVersion> {
    return new Trade(route, TradeType.EXACT_OUTPUT, tradeVersion)
  }

  /**
   * The percent difference between the mid price before the trade and the trade execution price.
   */
  public readonly priceImpact: Percent

  public constructor(route: MultiRoute, tradeType: TTradeType, tradeVersion: TTradeVersion = TradeVersion.TRIDENT) {
    this.route = route
    this.tradeType = tradeType
    this.tradeVersion = tradeVersion

    const amountIn = CurrencyAmount.fromRawAmount(route.fromToken as TInput, route.amountIn.toFixed(0))
    const amountOut = CurrencyAmount.fromRawAmount(route.toToken as TOutput, route.amountOut.toFixed(0))

    if (tradeType === TradeType.EXACT_INPUT) {
      this.inputAmount = CurrencyAmount.fromFractionalAmount(
        amountIn.currency,
        amountIn.numerator,
        amountIn.denominator
      )
      this.outputAmount = CurrencyAmount.fromFractionalAmount(
        amountOut.currency,
        amountOut.numerator,
        amountOut.denominator
      )
    } else {
      this.inputAmount = CurrencyAmount.fromFractionalAmount(
        amountIn.currency,
        amountOut.numerator,
        amountOut.denominator
      )
      this.outputAmount = CurrencyAmount.fromFractionalAmount(
        amountOut.currency,
        amountIn.numerator,
        amountIn.denominator
      )
    }

    this.executionPrice = new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.quotient,
      this.outputAmount.quotient
    )

    this.priceImpact = new Percent(JSBI.BigInt(0), JSBI.BigInt(10000))
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<TOutput> {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(this.outputAmount.quotient).quotient
      return CurrencyAmount.fromRawAmount(this.outputAmount.currency, slippageAdjustedAmountOut)
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<TInput> {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE)
        .add(slippageTolerance)
        .multiply(this.inputAmount.quotient).quotient
      return CurrencyAmount.fromRawAmount(this.inputAmount.currency, slippageAdjustedAmountIn)
    }
  }

  public static bestTradeExactIn<TInput extends Currency, TOutput extends Currency, TTradeVersion extends TradeVersion>(
    route: MultiRoute,
    currencyAmountIn: CurrencyAmount<TInput>,
    currencyOut: TOutput,
    tradeVersion?: TTradeVersion
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT, TTradeVersion> {
    return new Trade(
      { ...route, fromToken: currencyAmountIn.currency as RToken, toToken: currencyOut as RToken },
      TradeType.EXACT_INPUT,
      tradeVersion
    )
  }

  public static bestTradeExactOut<
    TInput extends Currency,
    TOutput extends Currency,
    TTradeVersion extends TradeVersion
  >(
    route: MultiRoute,
    currencyIn: TInput,
    currencyAmountOut: CurrencyAmount<TOutput>,
    tradeVersion?: TTradeVersion
  ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT, TTradeVersion> {
    return new Trade(
      { ...route, fromToken: currencyIn as RToken, toToken: currencyAmountOut.currency as RToken },
      TradeType.EXACT_OUTPUT,
      tradeVersion
    )
  }
}
