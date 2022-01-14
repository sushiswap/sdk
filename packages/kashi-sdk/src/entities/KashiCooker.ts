import { ChainId, WNATIVE_ADDRESS, ZERO, getProviderOrSigner, toElastic } from '@sushiswap/core-sdk'

import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import JSBI from 'jsbi'
import KASHIPAIR_ABI from '../constants/abis/kashipair.json'
import { KashiAction } from '../enums'
import { KashiPermit } from '../interfaces'
import { Web3Provider } from '@ethersproject/providers'
import { defaultAbiCoder } from '@ethersproject/abi'
import { toShare } from '@sushiswap/bentobox-sdk'

export class KashiCooker {
  private pair: any
  private account: string
  private library: Web3Provider | undefined
  private chainId: ChainId

  private actions: KashiAction[]
  private values: JSBI[]
  private datas: string[]

  constructor(
    pair: any,
    account: string | null | undefined,
    library: Web3Provider | undefined,
    chainId: ChainId | undefined
  ) {
    this.pair = pair
    this.account = account || AddressZero
    this.library = library
    this.chainId = chainId || 1

    this.actions = []
    this.values = []
    this.datas = []
  }

  add(action: KashiAction, data: string, value: JSBI = ZERO): void {
    this.actions.push(action)
    this.datas.push(data)
    this.values.push(value)
  }

  approve(permit: KashiPermit): void {
    if (permit) {
      this.add(
        KashiAction.BENTO_SETAPPROVAL,
        defaultAbiCoder.encode(
          ['address', 'address', 'bool', 'uint8', 'bytes32', 'bytes32'],
          [permit.account, permit.masterContract, true, permit.v, permit.r, permit.s]
        )
      )
    }
  }

  updateExchangeRate(mustUpdate = false, minRate = ZERO, maxRate = ZERO): KashiCooker {
    this.add(
      KashiAction.UPDATE_EXCHANGE_RATE,
      defaultAbiCoder.encode(['bool', 'uint256', 'uint256'], [mustUpdate, minRate, maxRate])
    )
    return this
  }

  bentoDepositCollateral(amount: JSBI): KashiCooker {
    const useNative = this.pair.collateral.address === WNATIVE_ADDRESS[this.chainId]

    this.add(
      KashiAction.BENTO_DEPOSIT,
      defaultAbiCoder.encode(
        ['address', 'address', 'int256', 'int256'],
        [useNative ? AddressZero : this.pair.collateral.address, this.account, amount, 0]
      ),
      useNative ? amount : ZERO
    )

    return this
  }

  bentoWithdrawCollateral(amount: JSBI, share: JSBI): KashiCooker {
    const useNative = this.pair.collateral.address === WNATIVE_ADDRESS[this.chainId]

    this.add(
      KashiAction.BENTO_WITHDRAW,
      defaultAbiCoder.encode(
        ['address', 'address', 'int256', 'int256'],
        [useNative ? AddressZero : this.pair.collateral.address, this.account, amount, share]
      ),
      useNative ? amount : ZERO
    )

    return this
  }

  bentoTransferCollateral(share: JSBI, toAddress: string): KashiCooker {
    this.add(
      KashiAction.BENTO_TRANSFER,
      defaultAbiCoder.encode(['address', 'address', 'int256'], [this.pair.collateral.address, toAddress, share])
    )

    return this
  }

  repayShare(part: JSBI): KashiCooker {
    this.add(KashiAction.GET_REPAY_SHARE, defaultAbiCoder.encode(['int256'], [part]))

    return this
  }

  addCollateral(amount: JSBI, fromBento: boolean): KashiCooker {
    let share: JSBI
    if (fromBento) {
      share = JSBI.lessThan(amount, ZERO) ? amount : toShare(this.pair.collateral, amount)
    } else {
      const useNative = this.pair.collateral.address === WNATIVE_ADDRESS[this.chainId]

      this.add(
        KashiAction.BENTO_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.collateral.address, this.account, amount, 0]
        ),
        useNative ? amount : ZERO
      )
      share = JSBI.BigInt(-2)
    }

    this.add(
      KashiAction.ADD_COLLATERAL,
      defaultAbiCoder.encode(['int256', 'address', 'bool'], [share, this.account, false])
    )
    return this
  }

  addAsset(amount: JSBI, fromBento: boolean): KashiCooker {
    let share: JSBI
    if (fromBento) {
      share = toShare(this.pair.asset, amount)
    } else {
      const useNative = this.pair.asset.address === WNATIVE_ADDRESS[this.chainId]

      this.add(
        KashiAction.BENTO_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, amount, 0]
        ),
        useNative ? amount : ZERO
      )
      share = JSBI.BigInt(-2)
    }

    this.add(KashiAction.ADD_ASSET, defaultAbiCoder.encode(['int256', 'address', 'bool'], [share, this.account, false]))
    return this
  }

  removeAsset(fraction: JSBI, toBento: boolean): KashiCooker {
    this.add(KashiAction.REMOVE_ASSET, defaultAbiCoder.encode(['int256', 'address'], [fraction, this.account]))
    if (!toBento) {
      const useNative = this.pair.asset.address === WNATIVE_ADDRESS[this.chainId]

      this.add(
        KashiAction.BENTO_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, 0, -1]
        )
      )
    }
    return this
  }

  removeCollateral(share: JSBI, toBento: boolean): KashiCooker {
    this.add(KashiAction.REMOVE_COLLATERAL, defaultAbiCoder.encode(['int256', 'address'], [share, this.account]))
    if (!toBento) {
      const useNative = this.pair.collateral.address === WNATIVE_ADDRESS[this.chainId]

      this.add(
        KashiAction.BENTO_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.collateral.address, this.account, 0, share]
        )
      )
    }
    return this
  }

  removeCollateralFraction(fraction: JSBI, toBento: boolean): KashiCooker {
    this.add(KashiAction.REMOVE_COLLATERAL, defaultAbiCoder.encode(['int256', 'address'], [fraction, this.account]))
    if (!toBento) {
      const useNative = this.pair.collateral.address === WNATIVE_ADDRESS[this.chainId]

      this.add(
        KashiAction.BENTO_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.collateral.address, this.account, 0, -1]
        )
      )
    }
    return this
  }

  borrow(amount: JSBI, toBento: boolean, toAddress = ''): KashiCooker {
    this.add(
      KashiAction.BORROW,
      defaultAbiCoder.encode(['int256', 'address'], [amount, toAddress && toBento ? toAddress : this.account])
    )
    if (!toBento) {
      const useNative = this.pair.asset.address === WNATIVE_ADDRESS[this.chainId]

      this.add(
        KashiAction.BENTO_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, toAddress || this.account, amount, 0]
        )
      )
    }
    return this
  }

  repay(amount: JSBI, fromBento: boolean): KashiCooker {
    if (!fromBento) {
      const useNative = this.pair.asset.address === WNATIVE_ADDRESS[this.chainId]

      this.add(
        KashiAction.BENTO_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, amount, 0]
        ),
        useNative ? amount : ZERO
      )
    }
    this.add(KashiAction.GET_REPAY_PART, defaultAbiCoder.encode(['int256'], [fromBento ? amount : -1]))
    this.add(KashiAction.REPAY, defaultAbiCoder.encode(['int256', 'address', 'bool'], [-1, this.account, false]))
    return this
  }

  repayPart(part: JSBI, fromBento: boolean): KashiCooker {
    if (!fromBento) {
      const useNative = this.pair.asset.address === WNATIVE_ADDRESS[this.chainId]

      this.add(KashiAction.GET_REPAY_SHARE, defaultAbiCoder.encode(['int256'], [part]))
      this.add(
        KashiAction.BENTO_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, 0, -1]
        ),
        // TODO: Put some warning in the UI or not allow repaying ETH directly from wallet, because this can't be pre-calculated
        useNative
          ? JSBI.divide(
              JSBI.multiply(toShare(this.pair.asset, toElastic(this.pair.totalBorrow, part, true)), JSBI.BigInt(1001)),
              JSBI.BigInt(1000)
            )
          : ZERO
      )
    }
    this.add(KashiAction.REPAY, defaultAbiCoder.encode(['int256', 'address', 'bool'], [part, this.account, false]))
    return this
  }

  action(
    address: string,
    value: JSBI,
    data: string,
    useValue1: boolean,
    useValue2: boolean,
    returnValues: number
  ): void {
    this.add(
      KashiAction.CALL,
      defaultAbiCoder.encode(
        ['address', 'bytes', 'bool', 'bool', 'uint8'],
        [address, data, useValue1, useValue2, returnValues]
      ),
      value
    )
  }

  async cook() {
    if (!this.library) {
      return {
        success: false,
      }
    }

    const kashiPairCloneContract = new Contract(
      this.pair.address,
      KASHIPAIR_ABI,
      getProviderOrSigner(this.library, this.account) as any
    )

    try {
      return {
        success: true,
        tx: await kashiPairCloneContract.cook(this.actions, this.values, this.datas, {
          value: this.values.reduce((a, b) => JSBI.add(a, b), ZERO),
        }),
      }
    } catch (error) {
      console.error('KashiCooker Error: ', error)
      return {
        success: false,
        error: error,
      }
    }
  }
}
