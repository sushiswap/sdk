import { ChainId } from "../enums/ChainId"
import { ChainKey } from "../enums/ChainKey"

export const CHAIN_KEY: { [chainId: number]: ChainKey } = {
    [ChainId.KOVAN]: ChainKey.KOVAN,
  }