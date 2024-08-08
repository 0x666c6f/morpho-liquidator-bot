// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Id} from "morpho-blue/interfaces/IMorpho.sol";

/// @title ILiquidator Interface
/// @notice Interface for the Liquidator contract that facilitates liquidations on the Morpho protocol
interface ILiquidator {
    /// @notice Emitted when a successful liquidation occurs
    /// @param id The market identifier
    /// @param collateralToken The address of the collateral token
    /// @param loanToken The address of the loan token
    /// @param seized The amount of collateral seized
    /// @param pair The address of the trading pair used for swap
    /// @param profit The profit made from the liquidation
    event SuccessfulLiquidation(
        Id id, address collateralToken, address loanToken, uint256 seized, address pair, uint256 profit
    );

    /// @notice Withdraws ETH from the contract
    /// @param amount The amount of ETH to withdraw
    function withdrawETH(uint256 amount) external;

    /// @notice Withdraws ERC20 tokens from the contract
    /// @param token The address of the ERC20 token
    /// @param amount The amount to withdraw
    function withdrawERC20(address token, uint256 amount) external;

    /// @notice Approves an ERC20 token for a specific address
    /// @param token The address of the ERC20 token
    /// @param to The address to approve
    /// @param amount The amount to approve
    function approveERC20(address token, address to, uint256 amount) external;

    /// @notice Initiates a liquidation on Morpho
    /// @param id The market identifier
    /// @param borrower The address of the borrower to liquidate
    /// @param seizedAssets The amount of assets to seize
    /// @param pair The address of the trading pair for swapping
    /// @param swapData The data for executing the swap
    function morphoLiquidate(Id id, address borrower, uint256 seizedAssets, address pair, bytes calldata swapData)
        external
        payable;

    /// @notice Callback function called by Morpho after a successful liquidation
    /// @param repaidAssets The amount of assets repaid
    /// @param data Encoded liquidation data
    /// @dev This function is called by Morpho (only) after a successful liquidation
    function onMorphoLiquidate(uint256 repaidAssets, bytes calldata data) external;
}
