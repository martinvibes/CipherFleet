// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./CipherFleet.sol";

contract CipherFleetFactory {
    CipherFleet[] public games;

    event GameContractCreated(address indexed gameAddress, uint256 indexed index);

    function createGameContract() external returns (address) {
        CipherFleet game = new CipherFleet();
        games.push(game);
        emit GameContractCreated(address(game), games.length - 1);
        return address(game);
    }

    function getGameCount() external view returns (uint256) {
        return games.length;
    }

    function getGame(uint256 index) external view returns (address) {
        return address(games[index]);
    }
}
