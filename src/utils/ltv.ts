import { Store } from "@subsquid/typeorm-store"
import { Market, Position } from "../model"
import { Block, ProcessorContext } from "../processor"
import { updatePrice } from "./oracle"
import { BigDecimal } from "@subsquid/big-decimal"
import { processLiquidation } from "./liquidation"
import { ORACLE_PRICE_SCALE } from "../constants"
import { wMulDown, wTaylorCompounded, toAssetsUp, mulDivDown } from "./math"

export async function computeLtv(ctx: ProcessorContext<Store>, position: Position, block: Block) {
  const currentTimestamp = BigInt(block.timestamp)
  const market = await ctx.store.findOneOrFail(Market, {
    where: { id: position.market.id },
    relations: { oracle: true, loanToken: true, collateralToken: true },
  })
  let lastTotalBorrowAssets = market.lastTotalBorrowAssets
  // Ideally, we fetch the lastRate.
  if (currentTimestamp > market.lastUpdateTimestamp && market.lastRate > 0n) {
    const elapsed = currentTimestamp - market.lastUpdateTimestamp
    const interests = wMulDown(lastTotalBorrowAssets, wTaylorCompounded(market.lastRate, elapsed))

    lastTotalBorrowAssets = lastTotalBorrowAssets + interests
  }

  position.lastUpdateTimestamp = market.lastUpdateTimestamp
  position.lastBorrowAssets = toAssetsUp(position.borrowShares, lastTotalBorrowAssets, market.lastTotalBorrowShares)

  position.lastPriceUsed = await updatePrice(ctx, market.oracle, block, position.lastUpdateTimestamp)
  if (position.lastPriceUsed === null || position.lastPriceUsed === undefined || position.lastBorrowAssets === 0n) {
    position.lastLtv = BigDecimal(0)
  } else {
    const maxBorrow = wMulDown(
      mulDivDown(position.collateral, position.lastPriceUsed!, ORACLE_PRICE_SCALE),
      market.lltv
    )

    if (maxBorrow === 0n) {
      position.lastLtv = BigDecimal(1) // bad debt position. Can happen with rounding errors on price
    } else {
      position.lastLtv = BigDecimal(position.lastBorrowAssets).div(BigDecimal(maxBorrow))
    }
  }
  await ctx.store.save(position)

  processLiquidation(ctx, position, market)
}
