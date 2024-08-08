import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const functions = {
    MORPHO: viewFun("0x3acb5624", "MORPHO()", {}, p.address),
    approveERC20: fun("0xa8e5e4aa", "approveERC20(address,address,uint256)", {"token": p.address, "to": p.address, "amount": p.uint256}, ),
    morphoLiquidate: fun("0xc5a734b3", "morphoLiquidate(bytes32,address,uint256,address,bytes)", {"id": p.bytes32, "borrower": p.address, "seizedAssets": p.uint256, "pair": p.address, "swapData": p.bytes}, ),
    onMorphoLiquidate: fun("0xcf7ea196", "onMorphoLiquidate(uint256,bytes)", {"repaidAssets": p.uint256, "data": p.bytes}, ),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    withdrawERC20: fun("0xa1db9782", "withdrawERC20(address,uint256)", {"token": p.address, "amount": p.uint256}, ),
    withdrawETH: fun("0xf14210a6", "withdrawETH(uint256)", {"amount": p.uint256}, ),
}

export class Contract extends ContractBase {

    MORPHO() {
        return this.eth_call(functions.MORPHO, {})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }
}

/// Function types
export type MORPHOParams = FunctionArguments<typeof functions.MORPHO>
export type MORPHOReturn = FunctionReturn<typeof functions.MORPHO>

export type ApproveERC20Params = FunctionArguments<typeof functions.approveERC20>
export type ApproveERC20Return = FunctionReturn<typeof functions.approveERC20>

export type MorphoLiquidateParams = FunctionArguments<typeof functions.morphoLiquidate>
export type MorphoLiquidateReturn = FunctionReturn<typeof functions.morphoLiquidate>

export type OnMorphoLiquidateParams = FunctionArguments<typeof functions.onMorphoLiquidate>
export type OnMorphoLiquidateReturn = FunctionReturn<typeof functions.onMorphoLiquidate>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type WithdrawERC20Params = FunctionArguments<typeof functions.withdrawERC20>
export type WithdrawERC20Return = FunctionReturn<typeof functions.withdrawERC20>

export type WithdrawETHParams = FunctionArguments<typeof functions.withdrawETH>
export type WithdrawETHReturn = FunctionReturn<typeof functions.withdrawETH>

