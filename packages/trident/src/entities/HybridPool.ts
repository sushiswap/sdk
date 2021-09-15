import { ChainId, ChainKey, CurrencyAmount, Token } from "@sushiswap/core-sdk";

import { Fee } from "../enums";
import all from "@sushiswap/trident/exports/all.json";
import { computeHybridPoolAddress } from "../functions";
import invariant from "tiny-invariant";

export class HybridPool {
  public readonly liquidityToken: Token;
  public readonly fee: Fee;
  public readonly a: number;
  private readonly tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>];
  public static getAddress(
    tokenA: Token,
    tokenB: Token,
    fee: Fee = Fee.DEFAULT,
    a: number
  ): string {
    return computeHybridPoolAddress({
      factoryAddress:
        all[ChainId.KOVAN][ChainKey.KOVAN].contracts.HybridPoolFactory.address,
      tokenA,
      tokenB,
      fee,
      a,
    });
  }

  public constructor(
    currencyAmountA: CurrencyAmount<Token>,
    currencyAmountB: CurrencyAmount<Token>,
    fee: Fee = Fee.DEFAULT,
    a: number
  ) {
    const currencyAmounts = currencyAmountA.currency.sortsBefore(
      currencyAmountB.currency
    ) // does safety checks
      ? [currencyAmountA, currencyAmountB]
      : [currencyAmountB, currencyAmountA];

    this.liquidityToken = new Token(
      currencyAmounts[0].currency.chainId,
      HybridPool.getAddress(
        currencyAmounts[0].currency,
        currencyAmounts[1].currency,
        fee,
        a
      ),
      18,
      "SLP",
      "Sushi LP Token"
    );
    this.fee = fee;
    this.a = a;
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
}
