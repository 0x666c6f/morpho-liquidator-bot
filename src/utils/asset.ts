import { Store } from "@subsquid/typeorm-store"
import { Asset } from "../model"
import { Block, ProcessorContext } from "../processor"
import { Contract } from "../abi/ERC20"
import { Address, getAddress } from "viem"

const MAKER = getAddress("0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2")

export async function getOrCreateAsset(ctx: ProcessorContext<Store>, block: Block, address: Address): Promise<Asset> {
  let asset = await ctx.store.get(Asset, address)
  if (asset === undefined) {
    asset = new Asset({ id: address })
    const erc20 = new Contract({ _chain: ctx._chain, block: block }, address)

    if (address === MAKER) {
      asset.symbol = "MKR"
      asset.decimals = 18n
    } else {
      try {
        const symbol = await erc20.symbol()
        asset.symbol = symbol
      } catch (error) {
        asset.symbol = "UNKNOWN"
      }

      try {
        const decimals = await erc20.decimals()
        asset.decimals = BigInt(decimals)
      } catch (error) {
        asset.decimals = 18n
      }
    }

    ctx.log.info("Adding new missing asset")
    ctx.log.info(asset)
    await ctx.store.save(asset)
  }
  return asset
}
