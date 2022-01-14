import { ChainId } from '../enums'
import { Token } from '../entities'

export type ChainTokenMap = {
  readonly [chainId in ChainId]?: Token
}
