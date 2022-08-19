import EXPORTS from '@sushiswap/trident/exports/all.json'
import { Fee } from '../enums/Fee'
import { ChainId, Token } from '@sushiswap/core-sdk'
import { computePoolInitCodeHash } from './computePoolInitCodeHash'

import constantProductPoolArtifactPreview from 'trident-preview/artifacts/contracts/pool/constant-product/ConstantProductPool.sol/ConstantProductPool.json'

import constantProductPoolArtifact from '@sushiswap/trident/artifacts/contracts/pool/constant-product/ConstantProductPool.sol/ConstantProductPool.json'

import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'

export const computeConstantProductPoolAddress = ({
  factoryAddress,
  tokenA,
  tokenB,
  fee,
  twap,
}: {
  factoryAddress: string
  tokenA: Token
  tokenB: Token
  fee: Fee
  twap: boolean
}): string => {
  // does safety checks
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

  const deployData = defaultAbiCoder.encode(
    ['address', 'address', 'uint256', 'bool'],
    [token0.address, token1.address, fee, twap]
  )

  // Compute init code hash based off the bytecode, deployData & masterDeployerAddress
  const CONSTANT_PRODUCT_POOL_INIT_CODE_HASH =
    token0.chainId === ChainId.MATIC
      ? computePoolInitCodeHash({
          creationCode: constantProductPoolArtifactPreview.bytecode,
          deployData,
          masterDeployerAddress: (EXPORTS as any)[token0.chainId][0].contracts.MasterDeployer.address,
        })
      : keccak256(['bytes'], [constantProductPoolArtifact.bytecode])

  // Compute pool address
  return getCreate2Address(factoryAddress, keccak256(['bytes'], [deployData]), CONSTANT_PRODUCT_POOL_INIT_CODE_HASH)
}
