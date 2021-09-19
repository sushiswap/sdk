import { CurrencyAmount, Token } from '@sushiswap/core-sdk'

export abstract class AbstractPool {
  abstract readonly liquidityToken: Token

  public abstract involvesToken(token: Token): boolean

  public abstract get chainId(): number

  public abstract get getLiquidityMinted(): CurrencyAmount<Token>

  public abstract get getLiquidityValue(): CurrencyAmount<Token>
}
