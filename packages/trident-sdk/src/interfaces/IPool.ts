import { ChainId, CurrencyAmount, Price, Token } from '@sushiswap/core-sdk'

import { Fee } from '../enums/Fee'

export interface IPool {
  readonly liquidityToken: Token
  readonly tokenAmounts: CurrencyAmount<Token>[]
  chainId: ChainId
  fee: Fee
  assets: Token[]
  reserves: CurrencyAmount<Token>[]
  getInputAmount(outputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, IPool]
  getOutputAmount(inputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, IPool]
  getLiquidityMinted(
    totalSupply: CurrencyAmount<Token>,
    tokenAmountA: CurrencyAmount<Token>,
    tokenAmountB: CurrencyAmount<Token>
  ): CurrencyAmount<Token>
  getLiquidityValue(
    token: Token,
    totalSupply: CurrencyAmount<Token>,
    liquidity: CurrencyAmount<Token>
  ): CurrencyAmount<Token>
  involvesToken(token: Token): boolean
  reserveOf(token: Token): CurrencyAmount<Token>
  priceOf(token: Token): Price<Token, Token>
}
