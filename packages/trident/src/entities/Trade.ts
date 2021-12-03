import { Currency, CurrencyAmount, Percent, Price, TradeType, ZERO, JSBI, Fraction, ONE } from '@sushiswap/core-sdk'
import { MultiRoute, RToken } from '@sushiswap/tines'
import invariant from 'tiny-invariant'

/**
 * Represents a trade executed against a list of pools.
 * Does not account for slippage, i.e. trades that front run this trade and move the price.
 */
export class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  /**
   * The route of the trade, i.e. which pools the trade goes through and the input/output currencies.
   */
  public readonly route: MultiRoute

  /**
   * The type of the trade, either exact in or exact out.
   */
  public readonly tradeType: TTradeType

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
   * @param amountIn the amount being passed in
   */
  public static exactIn<TInput extends Currency, TOutput extends Currency>(
    route: MultiRoute
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT> {
    return new Trade(route, TradeType.EXACT_INPUT)
  }

  /**
   * Constructs an exact out trade with the given amount out and route
   * @param route route of the exact out trade
   * @param amountOut the amount returned by the trade
   */
  public static exactOut<TInput extends Currency, TOutput extends Currency>(
    route: MultiRoute
  ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT> {
    return new Trade(route, TradeType.EXACT_OUTPUT)
  }

  /**
   * The percent difference between the mid price before the trade and the trade execution price.
   */
  public readonly priceImpact: Percent

  public constructor(
    route: MultiRoute,
    // amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>,
    tradeType: TTradeType
  ) {
    this.route = route
    this.tradeType = tradeType

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

    // this.priceImpact = computePriceImpact(route.midPrice, this.inputAmount, this.outputAmount)

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

  public static bestTradeExactIn<TInput extends Currency, TOutput extends Currency>(
    route: MultiRoute,
    currencyAmountIn: CurrencyAmount<TInput>,
    currencyOut: TOutput
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT> {
    return new Trade(
      { ...route, fromToken: currencyAmountIn.currency as RToken, toToken: currencyOut as RToken },
      TradeType.EXACT_INPUT
    )
  }

  public static bestTradeExactOut<TInput extends Currency, TOutput extends Currency>(
    route: MultiRoute,
    currencyIn: TInput,
    currencyAmountOut: CurrencyAmount<TOutput>
  ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT> {
    return new Trade(
      { ...route, fromToken: currencyIn as RToken, toToken: currencyAmountOut.currency as RToken },
      TradeType.EXACT_OUTPUT
    )
  }
}
