import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Oracle} from "./oracle.model"
import {Asset} from "./asset.model"
import {Position} from "./position.model"

@Entity_()
export class Market {
    constructor(props?: Partial<Market>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BigIntColumn_({nullable: false})
    lltv!: bigint

    @Index_()
    @ManyToOne_(() => Oracle, {nullable: true})
    oracle!: Oracle

    @BigIntColumn_({nullable: false})
    lastRate!: bigint

    @BigIntColumn_({nullable: false})
    lastTotalBorrowShares!: bigint

    @BigIntColumn_({nullable: false})
    lastTotalBorrowAssets!: bigint

    @BigIntColumn_({nullable: false})
    lastUpdateTimestamp!: bigint

    @Index_()
    @ManyToOne_(() => Asset, {nullable: true})
    loanToken!: Asset

    @Index_()
    @ManyToOne_(() => Asset, {nullable: true})
    collateralToken!: Asset

    @OneToMany_(() => Position, e => e.market)
    positions!: Position[]
}
