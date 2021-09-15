export const types = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  LimitOrder: [
    { name: 'maker', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOut', type: 'uint256' },
    { name: 'recipient', type: 'address' },
    { name: 'startTime', type: 'uint256' },
    { name: 'endTime', type: 'uint256' },
    { name: 'stopPrice', type: 'uint256' },
    { name: 'oracleAddress', type: 'address' },
    { name: 'oracleData', type: 'bytes32' }
  ]
}

export const bentoTypes = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  SetMasterContractApproval: [
    { name: 'warning', type: 'string' },
    { name: 'user', type: 'address' },
    { name: 'masterContract', type: 'address' },
    { name: 'approved', type: 'bool' },
    { name: 'nonce', type: 'uint256' }
  ]
}
export const name = 'LimitOrder'
