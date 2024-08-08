import { Address } from "viem"
import { base, mainnet } from "viem/chains"

export const CHAIN_ID = process.env.CHAIN_ID
export const CHAIN = CHAIN_ID === "1" ? mainnet : base
export const MORPHO_BLUE_ADDRESS: Address = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb"
export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000"
export const WETH_ADDRESS: Address =
  CHAIN_ID === "1" ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" : "0x4200000000000000000000000000000000000006"
export const ONEINCH_ROUTER_ADDRESS: Address = "0x1111111254fb6c44bAC0beD2854e76F90643097d"
export const BOT_ADDRESS: Address = "0x3154Cf16ccdb4C6d922629664174b904d80F2C35"
export const WAD = BigInt(1e18)
export const ORACLE_PRICE_SCALE = BigInt(1e36)
export const MAX_LIQ_INCENTIVE_FACTOR = BigInt(1.15e18)
export const LIQUIDATION_CURSOR = BigInt(0.3e18)
export const VIRTUAL_SHARES = 10n ** 6n
export const VIRTUAL_ASSETS = 1n
