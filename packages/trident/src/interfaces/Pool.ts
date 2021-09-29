import { Token } from '@sushiswap/core-sdk'

export interface Pool {
  get getAssets(): Token[]
}
