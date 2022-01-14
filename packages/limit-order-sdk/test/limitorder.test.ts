import { ChainId, CurrencyAmount, Price, Token } from '@sushiswap/core-sdk'
import { FillLimitOrder, ILimitOrderData, LimitOrder } from '../src'

import { BigNumber } from '@ethersproject/bignumber'

describe('Limit Order', () => {
  it('should create Limit Order', async () => {
    let tokenA = new Token(ChainId.MATIC, '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', 18, 'DAI')
    let tokenB = new Token(ChainId.MATIC, '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', 18, 'SUSHI')

    const amountIn = CurrencyAmount.fromRawAmount(tokenA, '9000000000000000000')
    const amountOut = CurrencyAmount.fromRawAmount(tokenB, '8000000000000000000')
    const stopPrice = '100000000000000000'

    const limitOrder = new LimitOrder(
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      amountIn,
      amountOut,
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0',
      '4078384250',
      stopPrice,
      '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      '0x00000000000000000000000000000000000000000000000000000000000000'
    )

    const carol = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
    const { v, r, s } = limitOrder.signdOrderWithPrivatekey(ChainId.MATIC, carol)
    expect(v).toEqual(27)
    expect(r).toEqual('0x711b4c27016d790b188e5cef55e9468aabb51fbdaa37900ce5cc0b6fe7386678')
    expect(s).toEqual('0x285e2469a47086ab79a152125337297579c23faca9c30ab60237430e99357677')

    let data = await limitOrder.send()
    expect(data.data).toEqual('Duplicate Order')
  }, 10000)

  it('Should calculate order digest', async () => {
    const tokenInAddress = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
    const tokenOutAddress = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'
    const amountInRaw = '19999999999999898'
    const amountOutRaw = '53999999999999724600'
    const tokenIn = new Token(ChainId.KOVAN, tokenInAddress, 18)
    const dai = new Token(ChainId.KOVAN, tokenOutAddress, 18)
    const amountIn = CurrencyAmount.fromRawAmount(tokenIn, amountInRaw)
    const amountOut = CurrencyAmount.fromRawAmount(dai, amountOutRaw)
    const stopPrice = '0'
    const start = '0'
    const end = '2000000000000'
    const oracleAddress = '0x0000000000000000000000000000000000000000'
    const oracleData = '0x00000000000000000000000000000000000000000000000000000000000000'
    const signerAddress = '0x0Cc7090D567f902F50cB5621a7d6A59874364bA1'
    const limitOrder = new LimitOrder(
      signerAddress,
      amountIn,
      amountOut,
      signerAddress,
      start,
      end,
      stopPrice,
      oracleAddress,
      oracleData
    )
    // console.log('order', JSON.stringify([signerAddress, amountInRaw, amountOutRaw, signerAddress, start, end, '0', oracleAddress, oracleData, '0', '28', "0xe436761869d31bb4ffb281e154f7dc1a88ad6eac0ed0116d1d03fecdc1255c73", "0x79454045f3f2115602ca684d28554bc8de8972be10636b2c8b4655f49e252979"]))
    expect(limitOrder.getTypeHash()).toEqual('0x64877b8800176d7075d010deacc25e3b5baedcabb0064f0f70287127a5ad1a51')
  })

  it('should instantiate new order instance', () => {
    const data: ILimitOrderData = {
      maker: '0x80cF9eD9556729A09DCd1E7a58f8401eB44e5525',
      tokenIn: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
      tokenOut: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
      tokenInDecimals: 18,
      tokenOutDecimals: 18,
      tokenInSymbol: 'SUSHI',
      tokenOutSymbol: 'DAI',
      amountIn: '13122000000000000',
      amountOut: '582528',
      recipient: '0x80cF9eD9556729A09DCd1E7a58f8401eB44e5525',
      startTime: '0',
      endTime: '2000000000000',
      stopPrice: '0',
      oracleAddress: '0x0000000000000000000000000000000000000000',
      oracleData: '0x00000000000000000000000000000000000000000000000000000000000000',
      v: 27,
      r: '0xb329d28a2d8789b7381cbe307dc687ea46f3dad763bde94b6814820617fbbb49',
      s: '0x74f47425d7dc35021016089c723e6cb09e874a45cc6d74f23dd4d15cc20b705c',
      chainId: 42,
    }
    const lOrder = LimitOrder.getLimitOrder(data)
    expect(lOrder.amountInRaw).toEqual('13122000000000000')
  })

  it('should use price correctly', () => {
    const tokenA = new Token(ChainId.KOVAN, '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', 18)
    const tokenB = new Token(ChainId.KOVAN, '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', 18)

    const amountIn = CurrencyAmount.fromRawAmount(tokenA, '9000000000000000000')
    const amountOut = CurrencyAmount.fromRawAmount(tokenB, '8000000000000000000')

    let limitOrder = new LimitOrder(
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      amountIn,
      amountOut,
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0',
      '4078384250',
      '0',
      '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      ''
    )
    const price = new Price(amountIn.currency, amountOut.currency, '100000000', '300000000')
    limitOrder = limitOrder.usePrice(price)

    expect(limitOrder.amountOut.quotient.toString()).toEqual('27000000000000000000')
  })

  it('should create limit order and return data to sign', () => {
    const tokenA = new Token(ChainId.KOVAN, '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', 18, 'DAI')
    const tokenB = new Token(ChainId.KOVAN, '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', 18, 'SUSHI')

    const amountIn = CurrencyAmount.fromRawAmount(tokenA, '9000000000000000000')
    const amountOut = CurrencyAmount.fromRawAmount(tokenB, '8000000000000000000')
    const stopPrice = '100000000000000000'

    const limitOrder = new LimitOrder(
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      amountIn,
      amountOut,
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0',
      '4078384250',
      stopPrice,
      '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      '0x00000000000000000000000000000000000000000000000000000000000000'
    )

    limitOrder.getTypedData()
  })

  it('should fill the limit order', () => {
    const tokenA = new Token(ChainId.KOVAN, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI')
    const tokenB = new Token(ChainId.KOVAN, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC')

    const amountIn = CurrencyAmount.fromRawAmount(tokenA, '9000000000000000000')
    const amountOut = CurrencyAmount.fromRawAmount(tokenB, '8000000000000000000')
    const stopPrice = '100000000000000000'

    const limitOrder = new LimitOrder(
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      amountIn,
      amountOut,
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0',
      '478384250',
      stopPrice,
      '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      '0x00000000000000000000000000000000000000000000000000000000000000'
    )

    const carol = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
    limitOrder.signdOrderWithPrivatekey(ChainId.KOVAN, carol)

    new FillLimitOrder(
      limitOrder,
      ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'],
      BigNumber.from(amountOut.quotient.toString()),
      BigNumber.from(amountOut.quotient.toString()),
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    )
  })
})
