import { Token } from '@sushiswap/core-sdk'

export interface Pool {
  readonly liquidityToken: Token
  get getAssets(): Token[]
}
