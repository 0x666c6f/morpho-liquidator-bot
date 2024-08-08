import { WAD, VIRTUAL_ASSETS, VIRTUAL_SHARES } from "../constants"

export function mulDivUp(x: bigint, y: bigint, z: bigint): bigint {
  return (x * y + (z - 1n)) / z
}

export function mulDivDown(x: bigint, y: bigint, z: bigint): bigint {
  return (x * y) / z
}

export function wMulDown(x: bigint, y: bigint): bigint {
  return (x * y) / WAD
}

export function wDivUp(x: bigint, y: bigint): bigint {
  return (x * WAD + y - BigInt(1)) / y
}

export function wTaylorCompounded(x: bigint, n: bigint): bigint {
  const firstTerm = x * n
  const secondTerm = mulDivDown(firstTerm, firstTerm, BigInt(1e18) * 2n)
  const thirdTerm = mulDivDown(secondTerm, firstTerm, BigInt(1e18) * 3n)

  return firstTerm + secondTerm + thirdTerm
}

export function toAssetsUp(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  return mulDivUp(shares, totalAssets + VIRTUAL_ASSETS, totalShares + VIRTUAL_SHARES)
}

export function toAssetsDown(shares: bigint, totalAssets: bigint, totalShares: bigint) {
  return mulDivDown(shares, totalAssets + VIRTUAL_ASSETS, totalShares + VIRTUAL_SHARES)
}
