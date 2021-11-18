import { ChainId, CurrencyAmount, Token } from '@sushiswap/core-sdk'
import { Fee } from '../enums/Fee'

export abstract class Pool {
  public abstract readonly liquidityToken: Token

  public abstract get chainId(): ChainId

  public abstract get fee(): Fee

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
