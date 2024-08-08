import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Market} from "./market.model"

@Entity_()
export class Oracle {
    constructor(props?: Partial<Oracle>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BigIntColumn_({nullable: true})
    price!: bigint | undefined | null

    @BigIntColumn_({nullable: false})
    lastPriceFetchTimestamp!: bigint

    @OneToMany_(() => Market, e => e.oracle)
    markets!: Market[]
}
