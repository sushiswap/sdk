import { ChainId, CurrencyAmount, InsufficientInputAmountError, Price, Token, ZERO } from '@sushiswap/core-sdk'
import { computeHybridLiquidity, computeHybridPoolAddress } from '../functions'

import { A_PRECISION } from '../constants'
import EXPORTS from '@sushiswap/trident/exports/all.json'
import { Fee } from '../enums'
import JSBI from 'jsbi'
import { Pool } from './Pool'
import invariant from 'tiny-invariant'

export class HybridPool implements Pool {
  public readonly liquidityToken: Token
  public readonly fee: Fee
  public readonly a: JSBI
  private readonly tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>]
  public static getAddress(tokenA: Token, tokenB: Token, fee: Fee = Fee.DEFAULT, a: JSBI = A_PRECISION): string {
    return computeHybridPoolAddress({
      factoryAddress: EXPORTS[ChainId.KOVAN][0].contracts.HybridPoolFactory.address,
      tokenA,
      tokenB,
      fee,
      a,
    })
  }

  public constructor(
    currencyAmountA: CurrencyAmount<Token>,
    currencyAmountB: CurrencyAmount<Token>,
    fee: Fee = Fee.DEFAULT,
    a: JSBI = A_PRECISION
  ) {
    const currencyAmounts = currencyAmountA.currency.sortsBefore(currencyAmountB.currency) // does safety checks
      ? [currencyAmountA, currencyAmountB]
      : [currencyAmountB, currencyAmountA]

    this.liquidityToken = new Token(
      currencyAmounts[0].currency.chainId,
      HybridPool.getAddress(currencyAmounts[0].currency, currencyAmounts[1].currency, fee, a),
      18,
      'SLP',
      'Sushi LP Token'
    )
    this.fee = fee
    this.a = a
    this.tokenAmounts = currencyAmounts as [CurrencyAmount<Token>, CurrencyAmount<Token>]
  }

  /**
   * Returns true if the token is either token0 or token1
   * @param token to check
   */
  public involvesToken(token: Token): boolean {
    return token.equals(this.token0) || token.equals(this.token1)
  }

  /**
   * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
   */
  public get token0Price(): Price<Token, Token> {
    const result = this.tokenAmounts[1].divide(this.tokenAmounts[0])
    return new Price(this.token0, this.token1, result.denominator, result.numerator)
  }

  /**
   * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
   */
  public get token1Price(): Price<Token, Token> {
    const result = this.tokenAmounts[0].divide(this.tokenAmounts[1])
    return new Price(this.token1, this.token0, result.denominator, result.numerator)
  }

  /**
   * Return the price of the given token in terms of the other token in the pair.
   * @param token token to return price of
   */
  public priceOf(token: Token): Price<Token, Token> {
    invariant(this.involvesToken(token), 'TOKEN')
    return token.equals(this.token0) ? this.token0Price : this.token1Price
  }

  /**
   * Returns the chain ID of the tokens in the pair.
   */
  public get chainId(): number {
    return this.token0.chainId
  }

  public get token0(): Token {
    return this.tokenAmounts[0].currency
  }

  public get token1(): Token {
    return this.tokenAmounts[1].currency
  }

  public get assets(): Token[] {
    return [this.tokenAmounts[0].currency, this.tokenAmounts[1].currency]
  }

  public get reserves(): CurrencyAmount<Token>[] {
    return [this.reserve0, this.reserve1]
  }

  public get reserve0(): CurrencyAmount<Token> {
    return this.tokenAmounts[0]
  }

  public get reserve1(): CurrencyAmount<Token> {
    return this.tokenAmounts[1]
  }

  public reserveOf(token: Token): CurrencyAmount<Token> {
    invariant(this.involvesToken(token), 'TOKEN')
    return token.equals(this.token0) ? this.reserve0 : this.reserve1
  }

  public getNonOptimalMintFee(amount0: JSBI, amount1: JSBI, reserve0: JSBI, reserve1: JSBI): [JSBI, JSBI] {
    if (JSBI.equal(reserve0, ZERO) || JSBI.equal(reserve1, ZERO)) {
      return [ZERO, ZERO]
    }
    const amount1Optimal = JSBI.divide(JSBI.multiply(amount0, reserve1), reserve0)

    if (JSBI.lessThanOrEqual(amount1Optimal, amount1)) {
      return [
        ZERO,
        JSBI.divide(
          JSBI.multiply(JSBI.BigInt(this.fee), JSBI.subtract(amount1, amount1Optimal)),
          JSBI.multiply(JSBI.BigInt(2), JSBI.BigInt(10000))
        ),
      ]
    } else {
      const amount0Optimal = JSBI.divide(JSBI.multiply(amount1, reserve0), reserve1)
      return [
        JSBI.divide(
          JSBI.multiply(JSBI.BigInt(this.fee), JSBI.subtract(amount0, amount0Optimal)),
          JSBI.multiply(JSBI.BigInt(2), JSBI.BigInt(10000))
        ),
        ZERO,
      ]
    }
  }

  public getLiquidityMinted(
    totalSupply: CurrencyAmount<Token>,
    tokenAmountA: CurrencyAmount<Token>,
    tokenAmountB: CurrencyAmount<Token>
  ): CurrencyAmount<Token> {
    invariant(totalSupply.currency.equals(this.liquidityToken), 'LIQUIDITY')
    const tokenAmounts = tokenAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
      ? [tokenAmountA, tokenAmountB]
      : [tokenAmountB, tokenAmountA]
    invariant(tokenAmounts[0].currency.equals(this.token0) && tokenAmounts[1].currency.equals(this.token1), 'TOKEN')

    // Expected balances after minting
    const balance0 = JSBI.add(tokenAmounts[0].quotient, this.reserve0.quotient)
    const balance1 = JSBI.add(tokenAmounts[1].quotient, this.reserve1.quotient)

    const [fee0, fee1] = this.getNonOptimalMintFee(
      tokenAmounts[0].quotient,
      tokenAmounts[1].quotient,
      this.reserve0.quotient,
      this.reserve1.quotient
    )

    let liquidity: JSBI

    const newLiquidity = computeHybridLiquidity(JSBI.subtract(balance0, fee0), JSBI.subtract(balance1, fee1), this.a)

    if (JSBI.equal(totalSupply.quotient, ZERO)) {
      liquidity = JSBI.subtract(newLiquidity, JSBI.BigInt(1000))
    } else {
      const oldLiquidity = computeHybridLiquidity(this.reserve0.quotient, this.reserve1.quotient, this.a)

      liquidity = JSBI.divide(
        JSBI.multiply(JSBI.subtract(newLiquidity, oldLiquidity), totalSupply.quotient),
        oldLiquidity
      )

      // console.log({
      //   oldLiquidity: oldLiquidity.toString(),
      // })
    }

    // console.log({
    //   tokenAmountA: tokenAmountA.quotient.toString(),
    //   tokenAmountB: tokenAmountB.quotient.toString(),
    //   totalSupply: totalSupply.quotient.toString(),
    //   newLiquidity: newLiquidity.toString(),
    //   liquidity: liquidity.toString(),
    // })

    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError()
    }

    return CurrencyAmount.fromRawAmount(this.liquidityToken, liquidity)
  }

  public getLiquidityValue(
    token: Token,
    totalSupply: CurrencyAmount<Token>,
    liquidity: CurrencyAmount<Token>
  ): CurrencyAmount<Token> {
    invariant(this.involvesToken(token), 'TOKEN')
    invariant(totalSupply.currency.equals(this.liquidityToken), 'TOTAL_SUPPLY')
    invariant(liquidity.currency.equals(this.liquidityToken), 'LIQUIDITY')
    invariant(JSBI.lessThanOrEqual(liquidity.quotient, totalSupply.quotient), 'LIQUIDITY')
    return CurrencyAmount.fromRawAmount(
      token,
      JSBI.divide(JSBI.multiply(liquidity.quotient, this.reserveOf(token).quotient), totalSupply.quotient)
    )
  }
}
