import { ChainId, Token, WETH9_ADDRESS, USDC_ADDRESS, CHAINLINK_ORACLE_ADDRESS } from '@sushiswap/core-sdk'

import { computePairAddress } from '../../src/functions/computePairAddress'

describe('computePoolAddress', () => {
  it('should correctly compute the pair address', () => {
    const collateral = new Token(ChainId.ETHEREUM, WETH9_ADDRESS[ChainId.ETHEREUM], 18, 'WETH', 'Wrapped Ether')
    const asset = new Token(ChainId.ETHEREUM, USDC_ADDRESS[ChainId.ETHEREUM], 6, 'USDC', 'USD Coin')

    expect(collateral.address).toEqual('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    expect(asset.address).toEqual('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

    const address = computePairAddress({
      collateral,
      asset,
      oracle: CHAINLINK_ORACLE_ADDRESS[ChainId.ETHEREUM],
      oracleData:
        '0x000000000000000000000000986b5e1e1755e3c2440e960477f25201b0a8bbd4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d3c21bcecceda1000000',
    })

    console.log({
      collateral: collateral.address,
      asset: asset.address,
      address,
    })

    expect(address).toEqual('0xB7b45754167d65347C93F3B28797887b4b6cd2F3')
  })
})
