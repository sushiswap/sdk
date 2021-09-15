import { keccak256, pack } from '@ethersproject/solidity'

import { defaultAbiCoder } from '@ethersproject/abi'

export const computePoolInitCodeHash = ({
  creationCode,
  deployData,
  masterDeployerAddress
}: {
  creationCode: string
  deployData: string
  masterDeployerAddress: string
}): string =>
  keccak256(
    ['bytes'],
    [
      pack(
        ['bytes', 'bytes'],
        [creationCode, defaultAbiCoder.encode(['bytes', 'address'], [deployData, masterDeployerAddress])]
      )
    ]
  )
