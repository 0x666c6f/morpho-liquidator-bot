import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"
import {Market} from "./market.model"

@Entity_()
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Market, {nullable: true})
    market!: Market

    @StringColumn_({nullable: false})
    borrower!: string

    @BigIntColumn_({nullable: false})
    borrowShares!: bigint

    @BigIntColumn_({nullable: false})
    collateral!: bigint

    @BigIntColumn_({nullable: false})
    lastUpdateTimestamp!: bigint

    @BigIntColumn_({nullable: false})
    lastBorrowAssets!: bigint

    @BigIntColumn_({nullable: true})
    lastPriceUsed!: bigint | undefined | null

    @BigDecimalColumn_({nullable: false})
    lastLtv!: BigDecimal
}
