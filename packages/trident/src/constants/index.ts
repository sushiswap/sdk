import { JSBI, ChainId, AddressMap } from '@sushiswap/core-sdk'

export const A_PRECISION = JSBI.BigInt(100)
export const MAX_FEE = JSBI.BigInt(10000)

export const ROUTER_ADDRESS: AddressMap = {
  [ChainId.KOVAN]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
}
