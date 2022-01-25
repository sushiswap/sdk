import { AddressMap, ChainId } from '@sushiswap/core-sdk'

export const LAMBDA_URL = 'https://9epjsvomc4.execute-api.us-east-1.amazonaws.com/dev'

export const SOCKET_URL = 'wss://hfimt374ge.execute-api.us-east-1.amazonaws.com/dev'

export const STOP_LIMIT_ORDER_ADDRESS: AddressMap = {
  [ChainId.KOVAN]: '0xce9365dB1C99897f04B3923C03ba9a5f80E8DB87',
  [ChainId.MATIC]: '0x1aDb3Bd86bb01797667eC382a0BC6A9854b4005f',
  [ChainId.AVALANCHE]: '0xf6f9c9DB78AF5791A296c4bF34d59E0236E990E0',
  [ChainId.FANTOM]: '0x0dd184Bec9e43701F76d75D5FFfE246B2DC8d4EA'
}

export const DEFAULT_RECEIVER_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0x8C6b2e5B8028825d371E1264f57C5CcaE0fa4D65',
  [ChainId.AVALANCHE]: '0x042c99C84b00f11A08a07AA9752E083261083A57',
  [ChainId.FANTOM]: '0x7a4f6a6Ca48Bf63C53DfF622bfa8E0DbA1c7A8c6'
}

export const ADVANCED_RECEIVER_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0xAA6370CD78A61D4e72911268D84bF1Ea6a976b77',
  [ChainId.AVALANCHE]: '0x50995361A1104B2E34d81771B2cf19BA55051C7c',
  [ChainId.FANTOM]: '0x506e3ce419976E91F2ca5BDAB96Ef253Df9dAD3b'
}

export const ROUND_UP_RECEIVER_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0x1C9B033F8C46C08EbE67F15924F5B9E97e36E0a7'
}