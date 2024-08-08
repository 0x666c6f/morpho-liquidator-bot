import { Store } from "@subsquid/typeorm-store"
import { Oracle } from "../model"
import { Block, ProcessorContext } from "../processor"
import { Contract } from "../abi/Oracle"
import { ZERO_ADDRESS } from "../constants"
import { Address } from "viem"

export async function getOrCreateOracle(
  ctx: ProcessorContext<Store>,
  block: Block,
  address: Address,
  timestamp: number
): Promise<Oracle> {
  let oracle = await ctx.store.get(Oracle, address)
  if (oracle == null) {
    oracle = new Oracle({ id: address })
    const oracleContract = new Contract({ _chain: ctx._chain, block: block }, address)
    oracle.lastPriceFetchTimestamp = BigInt(timestamp)
    if (address !== ZERO_ADDRESS) {
      try {
        const price = await oracleContract.price()
        oracle.price = price
      } catch (error) {
        ctx.log.warn(`Failed to fetch price for oracle ${address}`)
      }
    }
    ctx.log.info("Adding new missing oracle")
    ctx.log.info(oracle)
    await ctx.store.save(oracle)
  }
  return oracle
}

export async function updatePrice(
  ctx: ProcessorContext<Store>,
  oracle: Oracle,
  block: Block,
  timestamp: bigint
): Promise<bigint | null | undefined> {
  try {
    if (oracle) {
      const oracleContract = new Contract({ _chain: ctx._chain, block: block }, oracle.id)
      const price = await oracleContract.price()
      oracle.price = price
      oracle.lastPriceFetchTimestamp = BigInt(timestamp)
      await ctx.store.save(oracle)
      return oracle.price
    }
  } catch (error) {
    ctx.log.warn(`Failed to fetch price for oracle ${oracle.id}`)
  }
  return undefined
}
