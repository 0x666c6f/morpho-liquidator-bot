import { Store } from "@subsquid/typeorm-store"
import { ProcessorContext, Log } from "./processor"
import { Market, Position } from "./model"
import { events } from "./abi/MorphoBlue"
import { getOrCreateAsset } from "./utils/asset"
import { getOrCreateOracle } from "./utils/oracle"
import { getAddress, Hex } from "viem"
import { computeLtv } from "./utils/ltv"
import { BigDecimal } from "@subsquid/big-decimal"

export async function handleCreateMarket(ctx: ProcessorContext<Store>, log: Log) {
  ctx.log.info(`new CreateMarket event`)
  const event = events.CreateMarket.decode(log)
  ctx.log.info(event)
  let market = new Market()
  market.id = event.id
  market.lltv = event.marketParams.lltv
  market.lastTotalBorrowAssets = 0n
  market.lastTotalBorrowShares = 0n
  market.lastUpdateTimestamp = BigInt(log.block.timestamp)
  market.lastRate = 0n

  market.loanToken = await getOrCreateAsset(ctx, log.block, getAddress(event.marketParams.loanToken) as Hex)
  market.collateralToken = await getOrCreateAsset(ctx, log.block, getAddress(event.marketParams.collateralToken) as Hex)

  market.oracle = await getOrCreateOracle(
    ctx,
    log.block,
    getAddress(event.marketParams.oracle) as Hex,
    log.block.timestamp
  )

  await ctx.store.save(market)
}

export async function handleAccrueInterest(ctx: ProcessorContext<Store>, log: Log) {
  ctx.log.info(`new AccrueInterest event`)
  const event = events.AccrueInterest.decode(log)
  ctx.log.info(event)
  let market = await ctx.store.get(Market, event.id)
  if (market === undefined) {
    ctx.log.warn(`Market ${event.id} not found`)
    return
  }
  market.lastUpdateTimestamp = BigInt(log.block.timestamp)
  market.lastTotalBorrowAssets = market.lastTotalBorrowAssets + event.interest
  market.lastRate = event.prevBorrowRate
  await ctx.store.save(market)
}

export async function handleBorrow(ctx: ProcessorContext<Store>, log: Log) {
  ctx.log.info(`new Borrow event`)
  const event = events.Borrow.decode(log)
  ctx.log.info(event)
  let market = await ctx.store.get(Market, event.id)
  if (market === undefined) {
    throw new Error(`Market ${event.id} not found`)
  }
  market.lastTotalBorrowShares = market.lastTotalBorrowShares + event.shares
  market.lastTotalBorrowAssets = market.lastTotalBorrowAssets + event.assets
  await ctx.store.save(market)

  const positionId = event.id.concat(event.onBehalf)
  const position = await ctx.store.get(Position, {
    where: { id: positionId },
    relations: {
      market: true,
    },
  })
  if (position === undefined) {
    throw new Error(`Position ${positionId} not found`)
  }

  position.borrowShares = position.borrowShares + event.shares
  await computeLtv(ctx, position, log.block)
}

export async function handleLiquidate(ctx: ProcessorContext<Store>, log: Log) {
  ctx.log.info(`new Liquidate event`)
  const event = events.Liquidate.decode(log)
  ctx.log.info(event)
  let market = await ctx.store.get(Market, event.id)
  if (market === undefined) {
    throw new Error(`Market ${event.id} not found`)
  }

  const totalBorrowSharesReduced = event.repaidShares + event.badDebtShares

  market.lastTotalBorrowShares = market.lastTotalBorrowShares - totalBorrowSharesReduced
  market.lastTotalBorrowAssets = market.lastTotalBorrowAssets - event.repaidAssets

  await ctx.store.save(market)

  const positionId = event.id.concat(event.borrower)
  const position = await ctx.store.get(Position, {
    where: { id: positionId },
    relations: {
      market: true,
    },
  })

  if (position === undefined) {
    throw new Error(`Position ${positionId} not found`)
  }
  position.borrowShares = position.borrowShares - totalBorrowSharesReduced
  position.collateral = position.collateral - event.seizedAssets

  await computeLtv(ctx, position, log.block)
}

export async function handleRepay(ctx: ProcessorContext<Store>, log: Log) {
  ctx.log.info(`new Repay event`)
  const event = events.Repay.decode(log)
  ctx.log.info(event)
  const market = await ctx.store.get(Market, event.id)
  if (!market) {
    throw new Error(`Market ${event.id} not found`)
  }

  market.lastTotalBorrowShares = market.lastTotalBorrowShares - event.shares
  market.lastTotalBorrowAssets = market.lastTotalBorrowAssets - event.assets
  await ctx.store.save(market)

  const positionId = event.id.concat(event.onBehalf)
  const position = await ctx.store.get(Position, {
    where: { id: positionId },
    relations: {
      market: true,
    },
  })
  if (!position) {
    throw new Error(`Position ${positionId} not found`)
  }
  position.borrowShares = position.borrowShares - event.shares

  await computeLtv(ctx, position, log.block)
}

export async function handleSupplyCollateral(ctx: ProcessorContext<Store>, log: Log) {
  ctx.log.info(`new SupplyCollateral event`)
  const event = events.SupplyCollateral.decode(log)
  ctx.log.info(event)
  const positionId = event.id.concat(event.onBehalf)
  let position = await ctx.store.get(Position, {
    where: { id: positionId },
    relations: {
      market: true,
    },
  })
  if (!position) {
    const market = await ctx.store.get(Market, { where: { id: event.id }, relations: { oracle: true } })
    position = new Position({ id: positionId, market: market })
    position.collateral = BigInt(0)
    position.borrowShares = BigInt(0)
    position.lastBorrowAssets = BigInt(0)
    position.lastLtv = BigDecimal(0)
    position.lastPriceUsed = BigInt(0)
    position.borrower = event.onBehalf
  }
  position.collateral = position.collateral + event.assets
  await computeLtv(ctx, position, log.block)
}

export async function handleWithdrawCollateral(ctx: ProcessorContext<Store>, log: Log) {
  ctx.log.info(`new WithdrawCollateral event`)
  const event = events.WithdrawCollateral.decode(log)
  ctx.log.info(event)
  const positionId = event.id.concat(event.onBehalf)
  const position = await ctx.store.get(Position, {
    where: { id: positionId },
    relations: {
      market: true,
    },
  })
  if (!position) {
    throw new Error(`Position ${positionId} not found`)
  }
  position.collateral = position.collateral - event.assets
  await computeLtv(ctx, position, log.block)
}
