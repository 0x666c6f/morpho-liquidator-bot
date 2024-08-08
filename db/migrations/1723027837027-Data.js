module.exports = class Data1723027837027 {
    name = 'Data1723027837027'

    async up(db) {
        await db.query(`CREATE TABLE "asset" ("id" character varying NOT NULL, "symbol" text NOT NULL, "decimals" numeric NOT NULL, CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "oracle" ("id" character varying NOT NULL, "price" numeric, "last_price_fetch_timestamp" numeric NOT NULL, CONSTRAINT "PK_b0ff6dad00d93167559b9f85cab" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "position" ("id" character varying NOT NULL, "borrower" text NOT NULL, "borrow_shares" numeric NOT NULL, "collateral" numeric NOT NULL, "last_update_timestamp" numeric NOT NULL, "last_borrow_assets" numeric NOT NULL, "last_price_used" numeric, "last_ltv" numeric NOT NULL, "market_id" character varying, CONSTRAINT "PK_b7f483581562b4dc62ae1a5b7e2" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_d744886149158961e1b796182f" ON "position" ("market_id") `)
        await db.query(`CREATE TABLE "market" ("id" character varying NOT NULL, "lltv" numeric NOT NULL, "last_rate" numeric NOT NULL, "last_total_borrow_shares" numeric NOT NULL, "last_total_borrow_assets" numeric NOT NULL, "last_update_timestamp" numeric NOT NULL, "oracle_id" character varying, "loan_token_id" character varying, "collateral_token_id" character varying, CONSTRAINT "PK_1e9a2963edfd331d92018e3abac" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_9a15dec1991b9348a963e1e920" ON "market" ("oracle_id") `)
        await db.query(`CREATE INDEX "IDX_36be1824a6946d794d3c897cfd" ON "market" ("loan_token_id") `)
        await db.query(`CREATE INDEX "IDX_3e35592855a40be23e3a3b0943" ON "market" ("collateral_token_id") `)
        await db.query(`ALTER TABLE "position" ADD CONSTRAINT "FK_d744886149158961e1b796182f8" FOREIGN KEY ("market_id") REFERENCES "market"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "market" ADD CONSTRAINT "FK_9a15dec1991b9348a963e1e9205" FOREIGN KEY ("oracle_id") REFERENCES "oracle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "market" ADD CONSTRAINT "FK_36be1824a6946d794d3c897cfd8" FOREIGN KEY ("loan_token_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "market" ADD CONSTRAINT "FK_3e35592855a40be23e3a3b09431" FOREIGN KEY ("collateral_token_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "asset"`)
        await db.query(`DROP TABLE "oracle"`)
        await db.query(`DROP TABLE "position"`)
        await db.query(`DROP INDEX "public"."IDX_d744886149158961e1b796182f"`)
        await db.query(`DROP TABLE "market"`)
        await db.query(`DROP INDEX "public"."IDX_9a15dec1991b9348a963e1e920"`)
        await db.query(`DROP INDEX "public"."IDX_36be1824a6946d794d3c897cfd"`)
        await db.query(`DROP INDEX "public"."IDX_3e35592855a40be23e3a3b0943"`)
        await db.query(`ALTER TABLE "position" DROP CONSTRAINT "FK_d744886149158961e1b796182f8"`)
        await db.query(`ALTER TABLE "market" DROP CONSTRAINT "FK_9a15dec1991b9348a963e1e9205"`)
        await db.query(`ALTER TABLE "market" DROP CONSTRAINT "FK_36be1824a6946d794d3c897cfd8"`)
        await db.query(`ALTER TABLE "market" DROP CONSTRAINT "FK_3e35592855a40be23e3a3b09431"`)
    }
}
