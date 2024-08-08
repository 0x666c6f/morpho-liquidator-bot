// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Id} from "morpho-blue/interfaces/IMorpho.sol";

struct MorphoLiquidateData {
    Id id;
    address collateralToken;
    address loanToken;
    uint256 seized;
    address pair;
    bytes swapData;
}
