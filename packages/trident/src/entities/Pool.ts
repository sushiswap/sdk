import { CurrencyAmount, Token } from '@sushiswap/core-sdk'

export abstract class Pool {
  public abstract readonly liquidityToken: Token

  public abstract get chainId(): number

  public abstract get fee(): number

  public abstract get assets(): Token[]

  public abstract get reserves(): CurrencyAmount<Token>[]

  public abstract getLiquidityMinted(
    totalSupply: CurrencyAmount<Token>,
    tokenAmountA: CurrencyAmount<Token>,
    tokenAmountB: CurrencyAmount<Token>
  ): CurrencyAmount<Token>

  public abstract getLiquidityValue(
    token: Token,
    totalSupply: CurrencyAmount<Token>,
    liquidity: CurrencyAmount<Token>
  ): CurrencyAmount<Token>

  public abstract involvesToken(token: Token): boolean
}
