import { Position, Market } from "../model"
import { createPublicClient, http, Address, createWalletClient, Hex, ContractFunctionRevertedError } from "viem"
import {
  BOT_ADDRESS,
  CHAIN,
  LIQUIDATION_CURSOR,
  MAX_LIQ_INCENTIVE_FACTOR,
  ORACLE_PRICE_SCALE,
  WAD,
  WETH_ADDRESS,
} from "../constants"
import { mulDivDown, toAssetsUp, wDivUp, wMulDown, toAssetsDown } from "./math"
import { getQuote, getSwapCalldata } from "../services/1inch"
import { privateKeyToAccount } from "viem/accounts"
import LIQUIDATOR_ABI from "../../abi/Liquidator.json"
import { ProcessorContext } from "../processor"
import { Store } from "@subsquid/typeorm-store"

function isHealthy(position: Position, market: Market, collateralPrice: bigint): boolean {
  if (position.borrowShares === BigInt(0)) return true

  const borrowed = toAssetsUp(position.borrowShares, market.lastTotalBorrowAssets, market.lastTotalBorrowShares)
  const maxBorrow = wMulDown((position.collateral * collateralPrice) / ORACLE_PRICE_SCALE, market.lltv)

  return maxBorrow >= borrowed
}

export async function processLiquidation(ctx: ProcessorContext<Store>, position: Position, market: Market) {
  if (position.collateral === BigInt(0)) {
    return
  }

  try {
    // First, get the current collateral price
    const quoteResult = await getQuote(
      market.collateralToken.id as Address,
      market.loanToken.id as Address,
      position.collateral.toString()
    )

    const collateralPrice = (BigInt(quoteResult.dstAmount) * ORACLE_PRICE_SCALE) / BigInt(position.collateral)

    // Check if the position is healthy
    if (isHealthy(position, market, collateralPrice)) {
      return false
    } else {
      ctx.log.info(`Liquidating position ${position.id}`)
    }
    // Calculate seized assets similar to the Go implementation
    const seizedAssets = getSeizedAmtByShares(position.borrowShares, market, collateralPrice)
    const repaidAssets = toAssetsUp(position.borrowShares, market.lastTotalBorrowAssets, market.lastTotalBorrowShares)

    const swapResult = await getSwapCalldata(
      BOT_ADDRESS,
      market.collateralToken.id as Address,
      market.loanToken.id as Address,
      seizedAssets.toString()
    )

    const loanTokenOutAmt = BigInt(swapResult.dstAmount)
    if (loanTokenOutAmt <= repaidAssets) {
      ctx.log.info("Loan token out amount less than repaid")
      return false
    }

    const loanTokenRevenue = loanTokenOutAmt - repaidAssets

    // Calculate profit in WETH
    const wethQuote = await getQuote(market.loanToken.id as Address, WETH_ADDRESS, loanTokenRevenue.toString())

    const wethProfit = BigInt(wethQuote.dstAmount)
    const contractParameters = {
      address: BOT_ADDRESS,
      abi: LIQUIDATOR_ABI,
      functionName: "morphoLiquidate",
      account: walletClient.account,
      args: [position.market.id, position.borrower, seizedAssets, swapResult.tx.to, swapResult.tx.data],
    }
    const { request } = await publicClient.simulateContract(contractParameters)

    const gas = await publicClient.estimateContractGas(contractParameters)
    const txCost = gas * (await publicClient.getGasPrice())

    if (txCost >= wethProfit) {
      ctx.log.info("No profit")
      return false
    }

    const hash = await walletClient.writeContract(request)
    const transactionReceipt = await publicClient.waitForTransactionReceipt({ hash })

    if (transactionReceipt.status === "success") {
      ctx.log.info(`Liquidation successful. Profit: ${(wethProfit - txCost).toString()} WETH`)
      return true
    } else {
      ctx.log.error("Liquidation transaction confirmed but reverted")
      return false
    }
  } catch (err) {
    if (err instanceof ContractFunctionRevertedError) {
      ctx.log.error(`Liquidation failed. Execution reverted.Reason: ${err}`)
      return false
    } else {
      ctx.log.error(`Liquidation ignored. Reason: ${err}`)
      return false
    }
  }
}

function getSeizedAmtByShares(repaidShares: bigint, market: Market, collateralPrice: bigint): bigint {
  const oneMinusLltv = WAD - market.lltv
  const incentiveCalc = WAD - wMulDown(LIQUIDATION_CURSOR, oneMinusLltv)

  const calculatedLIF = wDivUp(WAD, incentiveCalc)
  const liquidationIncentiveFactor = calculatedLIF < MAX_LIQ_INCENTIVE_FACTOR ? calculatedLIF : MAX_LIQ_INCENTIVE_FACTOR

  const repaidAssets = toAssetsDown(repaidShares, market.lastTotalBorrowAssets, market.lastTotalBorrowShares)
  const seizedAssetsQuoted = wMulDown(repaidAssets, liquidationIncentiveFactor)

  return mulDivDown(seizedAssetsQuoted, ORACLE_PRICE_SCALE, collateralPrice)
}

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(process.env.RPC_ETH_HTTP),
})

export const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.EXECUTOR_PK! as Hex),
  transport: http(process.env.RPC_ETH_HTTP),
})
