# SushiSwap SDK Monorepo

## Prerequisites

- Yarn v3 (If unfamilair consult https://yarnpkg.com/getting-started/install to get started and familiarise yourself)
- Node v14 and above

## Versioning (Canary)

yarn lerna version --conventional-commits --conventional-prerelease --preid canary

## Publishing (Canary)

yarn lerna publish --conventional-commits --conventional-prerelease --preid canary


## Core SDK

### Testing

```sh 
yarn workspace @sushiswap/core-sdk test
```

### Build

```sh 
yarn workspace @sushiswap/core-sdk build
```

## Limit Order SDK

### Testing

```sh 
yarn workspace @sushiswap/limit-order-sdk test
```

### Build

```sh 
yarn workspace @sushiswap/limit-order-sdk build
```

## Trident SDK

### Testing

```sh 
yarn workspace @sushiswap/trident-sdk test
```

### Build

```sh 
yarn workspace @sushiswap/trident-sdk build
```

## Tines SDK

### Testing

```sh 
yarn workspace @sushiswap/tines test
```

### Build

```sh 
yarn workspace @sushiswap/tines build
```