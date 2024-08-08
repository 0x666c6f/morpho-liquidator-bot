import { TypeormDatabase } from "@subsquid/typeorm-store"
import { processor } from "./processor"
import { events } from "./abi/MorphoBlue"
import {
  handleAccrueInterest,
  handleBorrow,
  handleCreateMarket,
  handleLiquidate,
  handleRepay,
  handleSupplyCollateral,
  handleWithdrawCollateral,
} from "./handlers"

const eventHandlers = {
  [events.AccrueInterest.topic]: handleAccrueInterest,
  [events.Borrow.topic]: handleBorrow,
  [events.CreateMarket.topic]: handleCreateMarket,
  [events.Liquidate.topic]: handleLiquidate,
  [events.Repay.topic]: handleRepay,
  [events.SupplyCollateral.topic]: handleSupplyCollateral,
  [events.WithdrawCollateral.topic]: handleWithdrawCollateral,
}
processor.run(new TypeormDatabase({ supportHotBlocks: true }), async ctx => {
  for (let c of ctx.blocks) {
    for (let log of c.logs) {
      const handler = eventHandlers[log.topics[0]]
      if (handler) {
        await handler(ctx, log)
      }
    }
  }
})
