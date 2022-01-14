import { Token } from '../entities/Token'

export type ChainTokenList = {
  readonly [chainId: number]: Token[]
}
