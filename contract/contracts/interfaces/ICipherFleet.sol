// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface ICipherFleet {
    enum Phase { WAITING, PLACING, BATTLE, FINISHED }

    event GameCreated(uint256 indexed gameId, address indexed player1);
    event PlayerJoined(uint256 indexed gameId, address indexed player2);
    event ShipsPlaced(uint256 indexed gameId, address indexed player);
    event AttackSubmitted(uint256 indexed gameId, uint256 indexed attackId, address indexed attacker, uint8 row, uint8 col);
    event AttackResolved(uint256 indexed gameId, uint256 indexed attackId, bool isHit);
    event GameFinished(uint256 indexed gameId, address indexed winner);

    function createGame() external returns (uint256 gameId);
    function joinGame(uint256 gameId) external;
    function attack(uint256 gameId, uint8 row, uint8 col) external;
    function resolveAttack(uint256 gameId, uint256 attackId) external;

    function getGameState(uint256 gameId) external view returns (
        Phase phase, address p1, address p2, address turn,
        uint8 p1Ships, uint8 p2Ships, address gameWinner, uint256 totalAttacks
    );

    function getAttack(uint256 gameId, uint256 attackId) external view returns (
        address attacker, uint8 row, uint8 col, bool resolved, bool isHit
    );
}
