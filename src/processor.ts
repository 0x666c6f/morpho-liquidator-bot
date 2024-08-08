import { assertNotNull } from "@subsquid/util-internal"
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor"
import { events } from "./abi/MorphoBlue"
import { MORPHO_BLUE_ADDRESS } from "./constants"

export const processor = new EvmBatchProcessor()
  .setGateway(assertNotNull(process.env.ARCHIVE_URL, "No archive URL supplied"))
  .setRpcEndpoint({
    url: assertNotNull(process.env.RPC_ETH_HTTP, "No RPC endpoint supplied"),
    rateLimit: 1,
  })
  .setFinalityConfirmation(75)
  .setFields({
    transaction: {
      from: true,
      value: true,
      hash: true,
    },
    log: {
      address: true,
      topics: true,
      data: true,
      transactionHash: true,
    },
    block: {
      timestamp: true,
    },
  })
  .setBlockRange({
    from: Number(assertNotNull(process.env.START_BLOCK, "No start block supplied")),
  })
  .addLog({
    address: [MORPHO_BLUE_ADDRESS],
    topic0: [
      events.AccrueInterest.topic,
      events.Borrow.topic,
      events.CreateMarket.topic,
      events.Liquidate.topic,
      events.Repay.topic,
      events.SupplyCollateral.topic,
      events.WithdrawCollateral.topic,
    ],
  })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>
