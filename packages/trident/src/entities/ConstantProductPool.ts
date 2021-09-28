import {
  ChainId,
  ChainKey,
  CurrencyAmount,
  InsufficientInputAmountError,
  MINIMUM_LIQUIDITY,
  Price,
  Token,
  ZERO,
  sqrt,
} from '@sushiswap/core-sdk'

import { Fee } from '../enums'
import JSBI from 'jsbi'
import { Pool } from '../interfaces'
import all from '@sushiswap/trident/exports/all.json'
import { computeConstantProductPoolAddress } from '../functions'
import invariant from 'tiny-invariant'

export class ConstantProductPool implements Pool {
  public readonly liquidityToken: Token
  public readonly fee: Fee
  public readonly twap: boolean
  private readonly tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>]

  public static getAddress(tokenA: Token, tokenB: Token, fee: Fee = Fee.DEFAULT, twap: boolean = true): string {
    return computeConstantProductPoolAddress({
      factoryAddress: all[ChainId.KOVAN][ChainKey.KOVAN].contracts.ConstantProductPoolFactory.address,
      tokenA,
      tokenB,
      fee,
      twap,
    })
  }

  public constructor(
    currencyAmountA: CurrencyAmount<Token>,
    currencyAmountB: CurrencyAmount<Token>,
    fee: Fee = Fee.DEFAULT,
    twap: boolean = true
  ) {
    const currencyAmounts = currencyAmountA.currency.sortsBefore(currencyAmountB.currency) // does safety checks
      ? [currencyAmountA, currencyAmountB]
      : [currencyAmountB, currencyAmountA]
    this.liquidityToken = new Token(
      currencyAmounts[0].currency.chainId,
      ConstantProductPool.getAddress(currencyAmounts[0].currency, currencyAmounts[1].currency, fee, twap),
      18,
      'SLP',
      'Sushi LP Token'
    )
    this.fee = fee
    this.twap = twap
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

  public get getAssets(): Token[] {
    return [this.tokenAmounts[0].currency, this.tokenAmounts[1].currency]
  }

  public get reserve0(): CurrencyAmount<Token> {
    return this.tokenAmounts[0]
  }

  public get reserve1(): CurrencyAmount<Token> {
    return this.tokenAmounts[1]
  }

  public get kLast(): JSBI {
    return sqrt(this.reserve0.multiply(this.reserve1).quotient)
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

  public getMintFee(reserve0: JSBI, reserve1: JSBI, totalSupply: JSBI): JSBI {
    console.log('getMintFee', {
      kLast: this.kLast.toString(),
      computed: sqrt(JSBI.multiply(reserve0, reserve1)).toString(),
      totalSupply: totalSupply.toString(),
    })

    if (JSBI.notEqual(this.kLast, ZERO)) {
      const computed = sqrt(JSBI.multiply(reserve0, reserve1))
      if (JSBI.greaterThan(computed, this.kLast)) {
        const liquidity = JSBI.divide(
          JSBI.divide(
            JSBI.multiply(JSBI.multiply(totalSupply, JSBI.subtract(computed, this.kLast)), JSBI.BigInt(5)),
            computed
          ),
          JSBI.BigInt(10000)
        )

        console.log({
          kLast: this.kLast.toString(),
          computed: computed.toString(),
          liquidity: liquidity.toString(),
        })

        if (JSBI.notEqual(liquidity, ZERO)) {
          return liquidity
        }
      }
    }

    return ZERO
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

    let liquidity: JSBI

    // Expected balances after minting
    const balance0 = JSBI.add(tokenAmounts[0].quotient, this.reserve0.quotient)
    const balance1 = JSBI.add(tokenAmounts[1].quotient, this.reserve1.quotient)

    const [fee0, fee1] = this.getNonOptimalMintFee(
      tokenAmounts[0].quotient,
      tokenAmounts[1].quotient,
      this.reserve0.quotient,
      this.reserve1.quotient
    )

    const computed = sqrt(JSBI.multiply(JSBI.subtract(balance0, fee0), JSBI.subtract(balance1, fee1)))

    if (JSBI.equal(totalSupply.quotient, ZERO)) {
      liquidity = JSBI.subtract(computed, MINIMUM_LIQUIDITY)
    } else {
      const k = sqrt(JSBI.multiply(this.reserve0.quotient, this.reserve1.quotient))

      const mintFee = this.getMintFee(this.reserve0.quotient, this.reserve1.quotient, totalSupply.quotient)

      liquidity = JSBI.divide(JSBI.multiply(JSBI.subtract(computed, k), JSBI.add(totalSupply.quotient, mintFee)), k)

      // console.log({
      //   mintFee: mintFee.toString(),
      //   totalSupply: totalSupply.quotient.toString(),
      //   totalSupplyAfterMintFee: JSBI.add(
      //     totalSupply.quotient,
      //     this.getMintFee(this.reserve0.quotient, this.reserve1.quotient, totalSupply.quotient)
      //   ).toString(),
      //   computed: computed.toString(),
      //   token0Amount: tokenAmounts[0].quotient.toString(),
      //   token1Amount: tokenAmounts[1].quotient.toString(),
      //   reserve0: this.reserve0.quotient.toString(),
      //   reserve1: this.reserve1.quotient.toString(),
      //   balance0: balance0.toString(),
      //   balance1: balance1.toString(),
      //   fee0: fee0.toString(),
      //   fee1: fee1.toString(),
      //   kLast: this.kLast.toString(),
      //   k: k.toString(),
      //   kNext: sqrt(JSBI.multiply(balance0, balance1)).toString(),
      //   liquidity: liquidity.toString(),
      // })
    }

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
