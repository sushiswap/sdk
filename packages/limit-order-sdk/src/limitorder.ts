import { ChainId, CurrencyAmount, Price, Token, validateAndParseAddress } from '@sushiswap/core-sdk'
import { LAMBDA_URL, STOP_LIMIT_ORDER_ADDRESS } from './constants'
import { Message, getSignature, getSignatureWithProvider, getTypeHash, getTypedData } from './eip712'

import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { NonceManager } from '@ethersproject/experimental'
import { Signer } from '@ethersproject/abstract-signer'
import { Transaction } from '@ethersproject/transactions'
import { Web3Provider } from '@ethersproject/providers'
import abi from './abis/stop-limit-order.json'
import { defaultAbiCoder } from '@ethersproject/abi'
import fetch from 'isomorphic-unfetch'
import { keccak256 } from '@ethersproject/solidity'

export interface ILimitOrderData {
  maker: string
  tokenIn: string
  tokenOut: string
  tokenInDecimals: number
  tokenOutDecimals: number
  tokenInSymbol: string
  tokenOutSymbol: string
  amountIn: string
  amountOut: string
  recipient: string
  startTime: string | number
  endTime: string | number
  stopPrice?: string
  oracleAddress?: string
  oracleData?: string
  v: number
  r: string
  s: string
  chainId: ChainId
  orderTypeHash?: string
}

export class LimitOrder {
  public readonly maker: string
  public readonly amountIn: CurrencyAmount<Token>
  public readonly amountOut: CurrencyAmount<Token>
  public readonly recipient: string
  public readonly startTime: string
  public readonly endTime: string
  public readonly stopPrice: string
  public readonly oracleAddress: string
  public readonly oracleData: string
  public v: number
  public r: string
  public s: string

  static getLimitOrder(data: ILimitOrderData): LimitOrder {
    return new LimitOrder(
      data.maker,
      CurrencyAmount.fromRawAmount(
        new Token(data.chainId, data.tokenIn, data.tokenInDecimals, data.tokenInSymbol),
        data.amountIn
      ),
      CurrencyAmount.fromRawAmount(
        new Token(data.chainId, data.tokenOut, data.tokenOutDecimals, data.tokenOutSymbol),
        data.amountOut
      ),
      data.recipient,
      data.startTime,
      data.endTime,
      data.stopPrice,
      data.oracleAddress,
      data.oracleData,
      data.v,
      data.r,
      data.s
    )
  }

  constructor(
    maker: string,
    amountIn: CurrencyAmount<Token>,
    amountOut: CurrencyAmount<Token>,
    recipient: string,
    startTime: string | number,
    endTime: string | number,
    stopPrice = '0',
    oracleAddress = '0x0000000000000000000000000000000000000000',
    oracleData = '0x00000000000000000000000000000000000000000000000000000000000000',
    v = 0,
    r = '',
    s = ''
  ) {
    this.maker = validateAndParseAddress(maker)
    this.amountIn = amountIn
    this.amountOut = amountOut
    this.recipient = validateAndParseAddress(recipient)
    this.startTime = startTime.toString()
    this.endTime = endTime.toString()
    this.stopPrice = stopPrice
    this.oracleAddress = validateAndParseAddress(oracleAddress)
    this.oracleData = oracleData
    this.v = v
    this.r = r
    this.s = s
  }

  get amountInRaw(): string {
    return this.amountIn.quotient.toString()
  }

  get amountOutRaw(): string {
    return this.amountOut.quotient.toString()
  }

  get tokenInAddress(): string {
    return this.amountIn.currency.address
  }

  get tokenOutAddress(): string {
    return this.amountOut.currency.address
  }

  get tokenInDecimals(): number {
    return this.amountIn.currency.decimals
  }

  get tokenOutDecimals(): number {
    return this.amountOut.currency.decimals
  }

  get tokenInSymbol(): string {
    return this.amountIn.currency.symbol || ''
  }

  get tokenOutSymbol(): string {
    return this.amountOut.currency.symbol || ''
  }

  get chainId(): ChainId {
    return this.amountIn.currency.chainId
  }

  usePrice(price: Price<Token, Token>): LimitOrder {
    return new LimitOrder(
      this.maker,
      this.amountIn,
      CurrencyAmount.fromRawAmount(this.amountOut.currency, price.quote(this.amountIn).quotient.toString()),
      this.recipient,
      this.startTime,
      this.endTime,
      this.stopPrice,
      this.oracleAddress,
      this.oracleData
    )
  }

  signdOrderWithPrivatekey(chainId: ChainId, privateKey: string) {
    let order: Message = {
      maker: this.maker,
      tokenIn: this.tokenInAddress,
      tokenOut: this.tokenOutAddress,
      amountIn: this.amountInRaw,
      amountOut: this.amountOutRaw,
      recipient: this.recipient,
      startTime: this.startTime,
      endTime: this.endTime,
      stopPrice: this.stopPrice,
      oracleAddress: this.oracleAddress,
      oracleData: keccak256(['bytes'], [this.oracleData]),
    }

    const { v, r, s } = getSignature(order, chainId, privateKey)

    this.v = v
    this.r = r
    this.s = s

    return { v, r, s }
  }

  async signOrderWithProvider(chainId: ChainId, provider: Web3Provider) {
    let order: Message = {
      maker: this.maker,
      tokenIn: this.tokenInAddress,
      tokenOut: this.tokenOutAddress,
      amountIn: this.amountInRaw,
      amountOut: this.amountOutRaw,
      recipient: this.recipient,
      startTime: this.startTime,
      endTime: this.endTime,
      stopPrice: this.stopPrice,
      oracleAddress: this.oracleAddress,
      oracleData: keccak256(['bytes'], [this.oracleData]),
    }

    const { v, r, s } = await getSignatureWithProvider(order, chainId, provider)

    this.v = v
    this.r = r
    this.s = s

    return { v, r, s }
  }

  getTypedData() {
    let order: Message = {
      maker: this.maker,
      tokenIn: this.tokenInAddress,
      tokenOut: this.tokenOutAddress,
      amountIn: this.amountInRaw,
      amountOut: this.amountOutRaw,
      recipient: this.recipient,
      startTime: this.startTime,
      endTime: this.endTime,
      stopPrice: this.stopPrice,
      oracleAddress: this.oracleAddress,
      oracleData: keccak256(['bytes'], [this.oracleData]),
    }

    return getTypedData(order, this.chainId)
  }

  getTypeHash() {
    let typedData = this.getTypedData()
    let digest = getTypeHash(typedData)
    return digest
  }

  async send() {
    const resp = await fetch(`${LAMBDA_URL}/orders/create`, {
      method: 'POST',
      body: JSON.stringify({
        maker: this.maker,
        tokenIn: this.tokenInAddress,
        tokenOut: this.tokenOutAddress,
        tokenInDecimals: this.tokenInDecimals,
        tokenOutDecimals: this.tokenOutDecimals,
        tokenInSymbol: this.tokenInSymbol,
        tokenOutSymbol: this.tokenOutSymbol,
        amountIn: this.amountInRaw,
        amountOut: this.amountOutRaw,
        recipient: this.recipient,
        startTime: this.startTime,
        endTime: this.endTime,
        stopPrice: this.stopPrice,
        oracleAddress: this.oracleAddress,
        oracleData: this.oracleData,
        v: this.v,
        r: this.r,
        s: this.s,
        chainId: this.amountIn.currency.chainId,
      }),
    })

    return resp.json()
  }
}

export class FillLimitOrder {
  public readonly order: LimitOrder
  public readonly path: string[]
  public readonly amountExternal: BigNumber
  public readonly amountToFill: BigNumber
  public readonly limitOrderReceiver: string
  public readonly to: string
  public readonly tokenIn: string
  public readonly tokenOut: string
  public readonly limitOrderReceiverData: string

  constructor(
    order: LimitOrder,
    path: string[],
    amountExternal: BigNumber,
    amountToFill: BigNumber,
    limitOrderReceiver: string,
    to: string,
    keepTokenIn = false
  ) {
    this.order = order
    this.path = path.map(validateAndParseAddress)
    this.amountExternal = amountExternal
    this.amountToFill = amountToFill
    this.limitOrderReceiver = validateAndParseAddress(limitOrderReceiver)
    this.to = validateAndParseAddress(to)
    this.tokenIn = order.amountIn.currency.address
    this.tokenOut = order.amountOut.currency.address

    this.limitOrderReceiverData = defaultAbiCoder.encode(
      ['address[]', 'uint256', 'address', 'bool'],
      [this.path, this.amountExternal.toString(), this.to, keepTokenIn]
    )
  }

  public fillOrderOpen(
    signer: Signer,
    extra: {
      forceExecution?: boolean
      gasPrice?: BigNumber
      nonce?: number
      debug?: boolean
      open?: boolean
    }
  ) {
    extra.open = true
    return this.fillOrder(signer, extra)
  }

  public async fillOrder(
    signer: Signer | NonceManager,
    extra: {
      debug?: boolean
      forceExecution?: boolean
      gasPrice?: BigNumber
      open?: boolean
      nonce?: number
    }
  ): Promise<{ executed: boolean; transaction?: Transaction }> {
    const { gasPrice, nonce, forceExecution = false, open = false } = extra

    const func = open ? 'fillOrderOpen' : 'fillOrder'

    const orderArg = [
      this.order.maker,
      this.order.amountInRaw,
      this.order.amountOutRaw,
      this.order.recipient,
      this.order.startTime,
      this.order.endTime,
      this.order.stopPrice,
      this.order.oracleAddress,
      this.order.oracleData,
      this.amountToFill.toString(),
      this.order.v,
      this.order.r,
      this.order.s,
    ]

    const limitOrderContract = new Contract(STOP_LIMIT_ORDER_ADDRESS[this.order.chainId], abi, signer)

    let gasLimit
    let executed = true

    if (extra.debug) console.log(orderArg, this.path, this.limitOrderReceiver, this.limitOrderReceiverData)

    try {
      gasLimit = await limitOrderContract.estimateGas[func](
        orderArg,
        this.path[0],
        this.path[this.path.length - 1],
        this.limitOrderReceiver,
        this.limitOrderReceiverData
      )
      gasLimit = gasLimit.mul(11).div(10)
    } catch (e) {
      if (forceExecution) {
        console.log('Failed to estimate gas, forcing execution')
        gasLimit = BigNumber.from('400000') // 400k
        executed = true
      } else {
        return { executed: false }
      }
    }

    const transaction: Transaction = await limitOrderContract.fillOrder(
      orderArg,
      this.path[0],
      this.path[this.path.length - 1],
      this.limitOrderReceiver,
      this.limitOrderReceiverData,
      { gasLimit, gasPrice, nonce }
    )

    return { executed, transaction }
  }
}
