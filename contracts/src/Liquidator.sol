// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILiquidator} from "liquidator/interfaces/ILiquidator.sol";
import {IMorpho, MarketParams, Id} from "morpho-blue/interfaces/IMorpho.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {MorphoLiquidateData} from "liquidator/Types.sol";
import {NoProfit, OnlyMorpho, OnlyOwner} from "liquidator/Errors.sol";

/// @title Liquidator Contract
/// @notice Implements the ILiquidator interface to facilitate liquidations on the Morpho protocol
/// @dev Includes safety checks and owner-only functions
contract Liquidator is ILiquidator {
    address public immutable owner;

    address public immutable MORPHO;

    constructor(address morphoAddress) payable {
        owner = msg.sender;
        MORPHO = morphoAddress;
    }

    receive() external payable {}

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyMorpho() {
        if (msg.sender != MORPHO) revert OnlyMorpho();
        _;
    }

    /// @inheritdoc ILiquidator
    function withdrawERC20(address token, uint256 amount) external onlyOwner {
        SafeTransferLib.safeTransfer(token, msg.sender, amount);
    }

    /// @inheritdoc ILiquidator
    function withdrawETH(uint256 amount) external onlyOwner {
        SafeTransferLib.safeTransferETH(msg.sender, amount);
    }

    /// @inheritdoc ILiquidator
    function approveERC20(address token, address to, uint256 amount) external onlyOwner {
        SafeTransferLib.safeApprove(token, to, amount);
    }

    /// @inheritdoc ILiquidator
    function morphoLiquidate(Id id, address borrower, uint256 seizedAssets, address pair, bytes calldata swapData)
        external
        payable
        onlyOwner
    {
        MarketParams memory params = IMorpho(MORPHO).idToMarketParams(id);
        IMorpho(MORPHO).liquidate(
            params,
            borrower,
            seizedAssets,
            0,
            abi.encode(MorphoLiquidateData(id, params.collateralToken, params.loanToken, seizedAssets, pair, swapData))
        );
    }

    /// @inheritdoc ILiquidator
    function onMorphoLiquidate(uint256 repaidAssets, bytes calldata data) external onlyMorpho {
        MorphoLiquidateData memory arb = abi.decode(data, (MorphoLiquidateData));

        (bool success,) = arb.pair.call(arb.swapData);
        if (!success) revert("Swap failed");

        uint256 out = SafeTransferLib.balanceOf(arb.loanToken, address(this));
        if (out <= repaidAssets) revert NoProfit();

        SafeTransferLib.safeApprove(arb.loanToken, MORPHO, repaidAssets);

        emit SuccessfulLiquidation(arb.id, arb.collateralToken, arb.loanToken, arb.seized, arb.pair, out - repaidAssets);
    }
}
