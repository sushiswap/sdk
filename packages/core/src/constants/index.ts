import { ChainId, ChainKey } from "../enums";

import JSBI from "jsbi";

export * from "./addresses";
export * from "./natives";
export * from "./numbers";
export * from "./tokens";

// export const INIT_CODE_HASH: string = '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303'

export const CHAIN_KEY: { [chainId: number]: ChainKey } = {
  [ChainId.KOVAN]: ChainKey.KOVAN,
};

export const INIT_CODE_HASH: { [chainId: number]: string } = {
  [ChainId.MAINNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.ROPSTEN]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.RINKEBY]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.GÖRLI]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.KOVAN]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.FANTOM]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.MATIC]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.MATIC_TESTNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.XDAI]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.BSC]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.BSC_TESTNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.ARBITRUM]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.MOONBEAM_TESTNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.AVALANCHE]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.AVALANCHE_TESTNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.HECO]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.HECO_TESTNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.HARMONY]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.HARMONY_TESTNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.OKEX]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.OKEX_TESTNET]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.CELO]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.PALM]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.MOONRIVER]:
    "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
  [ChainId.FUSE]:
    "0x1901958ef8b470f2c0a3875a79ee0bd303866d85102c0f1ea820d317024d50b5",
};

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000);

export enum SolidityType {
  uint8 = "uint8",
  uint256 = "uint256",
}

export const SOLIDITY_TYPE_MAXIMA = {
  [SolidityType.uint8]: JSBI.BigInt("0xff"),
  [SolidityType.uint256]: JSBI.BigInt(
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
  ),
};
