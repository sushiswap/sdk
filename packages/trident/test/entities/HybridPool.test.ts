import {
  ChainId,
  ChainKey,
  CurrencyAmount,
  InsufficientInputAmountError,
  Price,
  Token,
  USDC_ADDRESS,
  WETH9,
  WETH9_ADDRESS,
} from '@sushiswap/core-sdk'

import { A_PRECISION } from '../../src/constants'
import { HybridPool } from '../../src/entities/HybridPool'
import all from '@sushiswap/trident/exports/all.json'
import { computeHybridPoolAddress } from '../../src/functions/computeHybridPoolAddress'

describe('computePoolAddress', () => {
  it('should correctly compute the pool address', () => {
    const tokenA = new Token(ChainId.KOVAN, USDC_ADDRESS[ChainId.KOVAN], 6, 'USDC', 'USD Coin')
    const tokenB = new Token(ChainId.KOVAN, WETH9_ADDRESS[ChainId.KOVAN], 18, 'WETH', 'Wrapped Ether')

    expect(tokenA.address).toEqual('0xb7a4F3E9097C08dA09517b5aB877F7a917224ede')
    expect(tokenB.address).toEqual('0xd0A1E359811322d97991E03f863a0C30C2cF029C')

    const fee = 30

    const address = computeHybridPoolAddress({
      factoryAddress: all[ChainId.KOVAN][ChainKey.KOVAN].contracts.ConstantProductPoolFactory.address,
      tokenA,
      tokenB,
      fee,
      a: A_PRECISION,
    })

    expect(address).toEqual('0x1345BF166c3AFB18CABF24D7e99755232689990B')
  })
})

describe('HybridPool', () => {
  const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')
  const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI Stablecoin')

  describe('constructor', () => {
    it('cannot be used for tokens on different chains', () => {
      expect(
        () => new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(WETH9[3], '100'))
      ).toThrow('CHAIN_IDS')
    })
  })

  describe('#getAddress', () => {
    it('returns the correct address', () => {
      expect(HybridPool.getAddress(USDC, DAI)).toEqual('0x5e8FF9E8F6b0b16B61B34Ea36FCE1c4bd7c4D1f5')
    })
  })

  describe('#token0', () => {
    it('always is the token that sorts before', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '100')).token0
      ).toEqual(DAI)
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '100'), CurrencyAmount.fromRawAmount(USDC, '100')).token0
      ).toEqual(DAI)
    })
  })
  describe('#token1', () => {
    it('always is the token that sorts after', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '100')).token1
      ).toEqual(USDC)
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '100'), CurrencyAmount.fromRawAmount(USDC, '100')).token1
      ).toEqual(USDC)
    })
  })
  describe('#reserve0', () => {
    it('always comes from the token that sorts before', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '101')).reserve0
      ).toEqual(CurrencyAmount.fromRawAmount(DAI, '101'))
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '101'), CurrencyAmount.fromRawAmount(USDC, '100')).reserve0
      ).toEqual(CurrencyAmount.fromRawAmount(DAI, '101'))
    })
  })
  describe('#reserve1', () => {
    it('always comes from the token that sorts after', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '101')).reserve1
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '101'), CurrencyAmount.fromRawAmount(USDC, '100')).reserve1
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
    })
  })

  describe('#token0Price', () => {
    it('returns price of token0 in terms of token1', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '101'), CurrencyAmount.fromRawAmount(DAI, '100')).token0Price
      ).toEqual(new Price(DAI, USDC, '100', '101'))
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '100'), CurrencyAmount.fromRawAmount(USDC, '101')).token0Price
      ).toEqual(new Price(DAI, USDC, '100', '101'))
    })
  })

  describe('#token1Price', () => {
    it('returns price of token1 in terms of token0', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '101'), CurrencyAmount.fromRawAmount(DAI, '100')).token1Price
      ).toEqual(new Price(USDC, DAI, '101', '100'))
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '100'), CurrencyAmount.fromRawAmount(USDC, '101')).token1Price
      ).toEqual(new Price(USDC, DAI, '101', '100'))
    })
  })

  describe('#priceOf', () => {
    const pair = new HybridPool(CurrencyAmount.fromRawAmount(USDC, '101'), CurrencyAmount.fromRawAmount(DAI, '100'))
    it('returns price of token in terms of other token', () => {
      expect(pair.priceOf(DAI)).toEqual(pair.token0Price)
      expect(pair.priceOf(USDC)).toEqual(pair.token1Price)
    })

    it('throws if invalid token', () => {
      expect(() => pair.priceOf(WETH9[1])).toThrow('TOKEN')
    })
  })

  describe('#reserveOf', () => {
    it('returns reserves of the given token', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '101')).reserveOf(
          USDC
        )
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '101'), CurrencyAmount.fromRawAmount(USDC, '100')).reserveOf(
          USDC
        )
      ).toEqual(CurrencyAmount.fromRawAmount(USDC, '100'))
    })

    it('throws if not in the pair', () => {
      expect(() =>
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '101'), CurrencyAmount.fromRawAmount(USDC, '100')).reserveOf(
          WETH9[1]
        )
      ).toThrow('TOKEN')
    })
  })

  describe('#chainId', () => {
    it('returns the token0 chainId', () => {
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '100')).chainId
      ).toEqual(1)
      expect(
        new HybridPool(CurrencyAmount.fromRawAmount(DAI, '100'), CurrencyAmount.fromRawAmount(USDC, '100')).chainId
      ).toEqual(1)
    })
  })
  describe('#involvesToken', () => {
    expect(
      new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '100')).involvesToken(
        USDC
      )
    ).toEqual(true)
    expect(
      new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '100')).involvesToken(
        DAI
      )
    ).toEqual(true)
    expect(
      new HybridPool(CurrencyAmount.fromRawAmount(USDC, '100'), CurrencyAmount.fromRawAmount(DAI, '100')).involvesToken(
        WETH9[1]
      )
    ).toEqual(false)
  })
  describe('miscellaneous', () => {
    it('getLiquidityMinted:0', async () => {
      const tokenA = new Token(3, '0x0000000000000000000000000000000000000001', 18)
      const tokenB = new Token(3, '0x0000000000000000000000000000000000000002', 18)
      const pool = new HybridPool(CurrencyAmount.fromRawAmount(tokenA, '0'), CurrencyAmount.fromRawAmount(tokenB, '0'))

      expect(() => {
        pool.getLiquidityMinted(
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '0'),
          CurrencyAmount.fromRawAmount(tokenA, '1'),
          CurrencyAmount.fromRawAmount(tokenB, '1')
        )
      }).toThrow(InsufficientInputAmountError)

      expect(() => {
        pool.getLiquidityMinted(
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '0'),
          CurrencyAmount.fromRawAmount(tokenA, '10'),
          CurrencyAmount.fromRawAmount(tokenB, '10')
        )
      }).toThrow(InsufficientInputAmountError)

      expect(() => {
        pool.getLiquidityMinted(
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '0'),
          CurrencyAmount.fromRawAmount(tokenA, '100'),
          CurrencyAmount.fromRawAmount(tokenB, '100')
        )
      }).toThrow(InsufficientInputAmountError)

      const liquidity = pool.getLiquidityMinted(
        CurrencyAmount.fromRawAmount(pool.liquidityToken, '0'),
        CurrencyAmount.fromRawAmount(tokenA, '1000'),
        CurrencyAmount.fromRawAmount(tokenB, '1000')
      )

      expect(liquidity.quotient.toString()).toEqual('1000')
    })

    it('getLiquidityMinted:!0', async () => {
      const tokenA = new Token(3, '0x0000000000000000000000000000000000000001', 18)
      const tokenB = new Token(3, '0x0000000000000000000000000000000000000002', 18)
      const pool = new HybridPool(
        CurrencyAmount.fromRawAmount(tokenA, '10000'),
        CurrencyAmount.fromRawAmount(tokenB, '10000')
      )

      expect(
        pool
          .getLiquidityMinted(
            CurrencyAmount.fromRawAmount(pool.liquidityToken, '10000'),
            CurrencyAmount.fromRawAmount(tokenA, '2000'),
            CurrencyAmount.fromRawAmount(tokenB, '2000')
          )
          .quotient.toString()
      ).toEqual('2000')
    })

    it('getLiquidityValue', async () => {
      const tokenA = new Token(3, '0x0000000000000000000000000000000000000001', 18)
      const tokenB = new Token(3, '0x0000000000000000000000000000000000000002', 18)
      const pool = new HybridPool(
        CurrencyAmount.fromRawAmount(tokenA, '1000'),
        CurrencyAmount.fromRawAmount(tokenB, '1000')
      )

      {
        const liquidityValue = pool.getLiquidityValue(
          tokenA,
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '1000'),
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '1000')
        )
        expect(liquidityValue.currency.equals(tokenA)).toBe(true)
        expect(liquidityValue.quotient.toString()).toBe('1000')
      }

      // 500
      {
        const liquidityValue = pool.getLiquidityValue(
          tokenA,
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '1000'),
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '500')
        )
        expect(liquidityValue.currency.equals(tokenA)).toBe(true)
        expect(liquidityValue.quotient.toString()).toBe('500')
      }

      // tokenB
      {
        const liquidityValue = pool.getLiquidityValue(
          tokenB,
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '1000'),
          CurrencyAmount.fromRawAmount(pool.liquidityToken, '1000')
        )
        expect(liquidityValue.currency.equals(tokenB)).toBe(true)
        expect(liquidityValue.quotient.toString()).toBe('1000')
      }
    })
  })
})
