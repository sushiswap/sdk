import {
  ChainId,
  ChainKey,
  CurrencyAmount,
  InsufficientInputAmountError,
  InsufficientReservesError,
  MINIMUM_LIQUIDITY,
  ONE,
  Price,
  Token,
  ZERO,
  _1000,
  _997,
  sqrt,
} from "@sushiswap/core-sdk";

import { Fee } from "../enums";
import JSBI from "jsbi";
import all from "@sushiswap/trident/exports/all.json";
import { computeConstantProductPoolAddress } from "../functions";
import invariant from "tiny-invariant";

export class ConstantProductPool {
  public readonly liquidityToken: Token;
  public readonly fee: Fee;
  public readonly twap: boolean;
  private readonly tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>];

  private readonly MAX_FEE = 10000;

  public static getAddress(
    tokenA: Token,
    tokenB: Token,
    fee: Fee = Fee.DEFAULT,
    twap: boolean = true
  ): string {
    return computeConstantProductPoolAddress({
      factoryAddress:
        all[ChainId.KOVAN][ChainKey.KOVAN].contracts.ConstantProductPoolFactory
          .address,
      tokenA,
      tokenB,
      fee,
      twap,
    });
  }

  public constructor(
    currencyAmountA: CurrencyAmount<Token>,
    currencyAmountB: CurrencyAmount<Token>,
    fee: Fee = 25,
    twap: boolean = true
  ) {
    const currencyAmounts = currencyAmountA.currency.sortsBefore(
      currencyAmountB.currency
    ) // does safety checks
      ? [currencyAmountA, currencyAmountB]
      : [currencyAmountB, currencyAmountA];
    this.liquidityToken = new Token(
      currencyAmounts[0].currency.chainId,
      ConstantProductPool.getAddress(
        currencyAmounts[0].currency,
        currencyAmounts[1].currency,
        fee,
        twap
      ),
      18,
      "SLP",
      "Sushi LP Token"
    );
    this.fee = fee;
    this.twap = twap;
    this.tokenAmounts = currencyAmounts as [
      CurrencyAmount<Token>,
      CurrencyAmount<Token>
    ];
  }

  /**
   * Returns true if the token is either token0 or token1
   * @param token to check
   */
  public involvesToken(token: Token): boolean {
    return token.equals(this.token0) || token.equals(this.token1);
  }

  /**
   * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
   */
  public get token0Price(): Price<Token, Token> {
    const result = this.tokenAmounts[1].divide(this.tokenAmounts[0]);
    return new Price(
      this.token0,
      this.token1,
      result.denominator,
      result.numerator
    );
  }

  /**
   * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
   */
  public get token1Price(): Price<Token, Token> {
    const result = this.tokenAmounts[0].divide(this.tokenAmounts[1]);
    return new Price(
      this.token1,
      this.token0,
      result.denominator,
      result.numerator
    );
  }

  /**
   * Return the price of the given token in terms of the other token in the pair.
   * @param token token to return price of
   */
  public priceOf(token: Token): Price<Token, Token> {
    invariant(this.involvesToken(token), "TOKEN");
    return token.equals(this.token0) ? this.token0Price : this.token1Price;
  }

  /**
   * Returns the chain ID of the tokens in the pair.
   */
  public get chainId(): number {
    return this.token0.chainId;
  }

  public get token0(): Token {
    return this.tokenAmounts[0].currency;
  }

  public get token1(): Token {
    return this.tokenAmounts[1].currency;
  }

  public get reserve0(): CurrencyAmount<Token> {
    return this.tokenAmounts[0];
  }

  public get reserve1(): CurrencyAmount<Token> {
    return this.tokenAmounts[1];
  }

  public reserveOf(token: Token): CurrencyAmount<Token> {
    invariant(this.involvesToken(token), "TOKEN");
    return token.equals(this.token0) ? this.reserve0 : this.reserve1;
  }

  public getOutputAmount(
    inputAmount: CurrencyAmount<Token>
  ): [CurrencyAmount<Token>, ConstantProductPool] {
    invariant(this.involvesToken(inputAmount.currency), "TOKEN");
    if (
      JSBI.equal(this.reserve0.quotient, ZERO) ||
      JSBI.equal(this.reserve1.quotient, ZERO)
    ) {
      throw new InsufficientReservesError();
    }
    const inputReserve = this.reserveOf(inputAmount.currency);
    const outputReserve = this.reserveOf(
      inputAmount.currency.equals(this.token0) ? this.token1 : this.token0
    );
    const inputAmountWithFee = JSBI.multiply(inputAmount.quotient, _997);
    const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.quotient);
    const denominator = JSBI.add(
      JSBI.multiply(inputReserve.quotient, _1000),
      inputAmountWithFee
    );
    const outputAmount = CurrencyAmount.fromRawAmount(
      inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
      JSBI.divide(numerator, denominator)
    );
    if (JSBI.equal(outputAmount.quotient, ZERO)) {
      throw new InsufficientInputAmountError();
    }
    return [
      outputAmount,
      new ConstantProductPool(
        inputReserve.add(inputAmount),
        outputReserve.subtract(outputAmount)
      ),
    ];
  }

  public getInputAmount(
    outputAmount: CurrencyAmount<Token>
  ): [CurrencyAmount<Token>, ConstantProductPool] {
    invariant(this.involvesToken(outputAmount.currency), "TOKEN");
    if (
      JSBI.equal(this.reserve0.quotient, ZERO) ||
      JSBI.equal(this.reserve1.quotient, ZERO) ||
      JSBI.greaterThanOrEqual(
        outputAmount.quotient,
        this.reserveOf(outputAmount.currency).quotient
      )
    ) {
      throw new InsufficientReservesError();
    }

    const outputReserve = this.reserveOf(outputAmount.currency);
    const inputReserve = this.reserveOf(
      outputAmount.currency.equals(this.token0) ? this.token1 : this.token0
    );
    const numerator = JSBI.multiply(
      JSBI.multiply(inputReserve.quotient, outputAmount.quotient),
      _1000
    );
    const denominator = JSBI.multiply(
      JSBI.subtract(outputReserve.quotient, outputAmount.quotient),
      _997 // 3%
    );
    const inputAmount = CurrencyAmount.fromRawAmount(
      outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
      JSBI.add(JSBI.divide(numerator, denominator), ONE)
    );
    return [
      inputAmount,
      new ConstantProductPool(
        inputReserve.add(inputAmount),
        outputReserve.subtract(outputAmount),
        this.fee,
        this.twap
      ),
    ];
  }

  private getNonOptimalMintFee(
    amount0: JSBI,
    amount1: JSBI,
    reserve0: JSBI,
    reserve1: JSBI
  ): [JSBI, JSBI] {
    if (JSBI.equal(reserve0, ZERO) || JSBI.equal(reserve1, ZERO)) {
      return [ZERO, ZERO];
    }
    const amount1Optimal = JSBI.divide(
      JSBI.multiply(amount0, reserve1),
      reserve0
    );

    if (JSBI.lessThanOrEqual(amount1Optimal, amount1)) {
      return [
        ZERO,
        JSBI.divide(
          JSBI.multiply(
            JSBI.BigInt(this.fee),
            JSBI.subtract(amount1, amount1Optimal)
          ),
          JSBI.multiply(JSBI.BigInt(2), JSBI.BigInt(10000))
        ),
      ];
    } else {
      const amount0Optimal = JSBI.divide(
        JSBI.multiply(amount1, reserve0),
        reserve1
      );
      return [
        JSBI.divide(
          JSBI.multiply(
            JSBI.BigInt(this.fee),
            JSBI.subtract(amount0, amount0Optimal)
          ),
          JSBI.multiply(JSBI.BigInt(2), JSBI.BigInt(10000))
        ),
        ZERO,
      ];
    }
  }

  public getLiquidityMinted(
    totalSupply: CurrencyAmount<Token>,
    tokenAmountA: CurrencyAmount<Token>,
    tokenAmountB: CurrencyAmount<Token>
  ): CurrencyAmount<Token> {
    invariant(totalSupply.currency.equals(this.liquidityToken), "LIQUIDITY");
    const tokenAmounts = tokenAmountA.currency.sortsBefore(
      tokenAmountB.currency
    ) // does safety checks
      ? [tokenAmountA, tokenAmountB]
      : [tokenAmountB, tokenAmountA];
    invariant(
      tokenAmounts[0].currency.equals(this.token0) &&
        tokenAmounts[1].currency.equals(this.token1),
      "TOKEN"
    );

    const amount0 = JSBI.divide(
      JSBI.multiply(tokenAmounts[0].quotient, totalSupply.quotient),
      this.reserve0.quotient
    );

    const amount1 = JSBI.divide(
      JSBI.multiply(tokenAmounts[1].quotient, totalSupply.quotient),
      this.reserve1.quotient
    );

    const [fee0, fee1] = this.getNonOptimalMintFee(
      amount0,
      amount1,
      this.reserve0.quotient,
      this.reserve1.quotient
    );

    let liquidity: JSBI;

    const computed = JSBI.multiply(
      JSBI.subtract(tokenAmounts[0].quotient, fee0),
      JSBI.subtract(tokenAmounts[1].quotient, fee1)
    );

    if (JSBI.equal(totalSupply.quotient, ZERO)) {
      liquidity = JSBI.subtract(sqrt(computed), MINIMUM_LIQUIDITY);
    } else {
      const k = sqrt(
        JSBI.multiply(this.reserve0.quotient, this.reserve1.quotient)
      );
      liquidity = JSBI.divide(
        JSBI.multiply(JSBI.subtract(sqrt(computed), k), totalSupply.quotient),
        k
      );
    }
    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError();
    }
    return CurrencyAmount.fromRawAmount(this.liquidityToken, liquidity);
  }

  public getLiquidityValue(
    token: Token,
    totalSupply: CurrencyAmount<Token>,
    liquidity: CurrencyAmount<Token>
  ): CurrencyAmount<Token> {
    invariant(this.involvesToken(token), "TOKEN");
    invariant(totalSupply.currency.equals(this.liquidityToken), "TOTAL_SUPPLY");
    invariant(liquidity.currency.equals(this.liquidityToken), "LIQUIDITY");
    invariant(
      JSBI.lessThanOrEqual(liquidity.quotient, totalSupply.quotient),
      "LIQUIDITY"
    );
    return CurrencyAmount.fromRawAmount(
      token,
      JSBI.divide(
        JSBI.multiply(liquidity.quotient, this.reserveOf(token).quotient),
        totalSupply.quotient
      )
    );
  }
}
