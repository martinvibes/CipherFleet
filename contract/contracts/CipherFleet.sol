// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract CipherFleet {
    // ══════════════════════════════════════════
    // TYPES
    // ══════════════════════════════════════════
    enum Phase { WAITING, PLACING, BATTLE, FINISHED }

    struct Player {
        address addr;
        uint8 shipsRemaining;
        bool hasPlaced;
    }

    struct AttackRecord {
        address attacker;
        uint8 row;
        uint8 col;
        ebool resultHandle;
        bool resolved;
        bool isHit;
    }

    // ══════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════
    uint256 public gameCount;

    // Game-level state
    mapping(uint256 => Phase) public gamePhase;
    mapping(uint256 => address) public gamePlayer1;
    mapping(uint256 => address) public gamePlayer2;
    mapping(uint256 => address) public currentTurn;
    mapping(uint256 => address) public winner;
    mapping(uint256 => uint8) public player1ShipsRemaining;
    mapping(uint256 => uint8) public player2ShipsRemaining;
    mapping(uint256 => bool) public player1HasPlaced;
    mapping(uint256 => bool) public player2HasPlaced;
    mapping(uint256 => uint256) public attackCount;

    // Encrypted grids: gameId => player => row => col => encrypted cell value
    // euint8: 0 = water, 1 = ship
    mapping(uint256 => mapping(address => mapping(uint8 => mapping(uint8 => euint8)))) private grids;

    // Attack history
    mapping(uint256 => mapping(uint256 => AttackRecord)) public attacks;

    // Track which cells have been attacked (gameId => defender => row => col => attacked)
    mapping(uint256 => mapping(address => mapping(uint8 => mapping(uint8 => bool)))) public cellAttacked;

    // ══════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════
    event GameCreated(uint256 indexed gameId, address indexed player1);
    event PlayerJoined(uint256 indexed gameId, address indexed player2);
    event ShipsPlaced(uint256 indexed gameId, address indexed player);
    event AttackSubmitted(uint256 indexed gameId, uint256 indexed attackId, address indexed attacker, uint8 row, uint8 col);
    event AttackResolved(uint256 indexed gameId, uint256 indexed attackId, bool isHit);
    event GameFinished(uint256 indexed gameId, address indexed winner);

    // ══════════════════════════════════════════
    // MODIFIERS
    // ══════════════════════════════════════════
    modifier validCoord(uint8 row, uint8 col) {
        require(row < 8 && col < 8, "Coordinates out of bounds");
        _;
    }

    // ══════════════════════════════════════════
    // GAME LIFECYCLE
    // ══════════════════════════════════════════

    /// @notice Create a new game. Caller becomes player 1.
    function createGame() external returns (uint256 gameId) {
        gameId = gameCount++;
        gamePlayer1[gameId] = msg.sender;
        gamePhase[gameId] = Phase.WAITING;
        player1ShipsRemaining[gameId] = 11; // 4+3+2+2 = 11 cells
        emit GameCreated(gameId, msg.sender);
    }

    /// @notice Join an existing game. Caller becomes player 2.
    function joinGame(uint256 gameId) external {
        require(gamePhase[gameId] == Phase.WAITING, "Game not waiting for player");
        require(gamePlayer1[gameId] != msg.sender, "Cannot join own game");

        gamePlayer2[gameId] = msg.sender;
        player2ShipsRemaining[gameId] = 11;
        gamePhase[gameId] = Phase.PLACING;

        emit PlayerJoined(gameId, msg.sender);
    }

    /// @notice Place ships on the grid. Each cell with a ship is encrypted as euint8(1).
    /// @param gameId The game ID
    /// @param rows Array of row coordinates (plaintext, 0-7)
    /// @param cols Array of col coordinates (plaintext, 0-7)
    /// @param shipValues Array of encrypted values (should all encrypt to 1)
    function placeShips(
        uint256 gameId,
        uint8[] calldata rows,
        uint8[] calldata cols,
        InEuint8[] calldata shipValues
    ) external {
        require(gamePhase[gameId] == Phase.PLACING, "Not in placing phase");
        require(_isPlayer(gameId, msg.sender), "Not a player in this game");
        require(!_hasPlaced(gameId, msg.sender), "Already placed ships");
        require(rows.length == 11, "Must place exactly 11 ship cells");
        require(rows.length == cols.length && cols.length == shipValues.length, "Array length mismatch");

        for (uint8 i = 0; i < rows.length; i++) {
            require(rows[i] < 8 && cols[i] < 8, "Coordinate out of bounds");

            // Convert encrypted input to euint8 and store
            euint8 val = FHE.asEuint8(shipValues[i]);
            FHE.allowThis(val);

            grids[gameId][msg.sender][rows[i]][cols[i]] = val;
        }

        // Mark player as having placed ships
        if (msg.sender == gamePlayer1[gameId]) {
            player1HasPlaced[gameId] = true;
        } else {
            player2HasPlaced[gameId] = true;
        }

        emit ShipsPlaced(gameId, msg.sender);

        // If both players have placed, start battle
        if (player1HasPlaced[gameId] && player2HasPlaced[gameId]) {
            gamePhase[gameId] = Phase.BATTLE;
            currentTurn[gameId] = gamePlayer1[gameId]; // Player 1 goes first
        }
    }

    /// @notice Attack an enemy cell. Runs FHE.eq() on the encrypted grid.
    /// @param gameId The game ID
    /// @param row Target row (0-7)
    /// @param col Target column (0-7)
    function attack(
        uint256 gameId,
        uint8 row,
        uint8 col
    ) external validCoord(row, col) {
        require(gamePhase[gameId] == Phase.BATTLE, "Not in battle phase");
        require(msg.sender == currentTurn[gameId], "Not your turn");

        address defender = _getOpponent(gameId, msg.sender);
        require(!cellAttacked[gameId][defender][row][col], "Cell already attacked");

        cellAttacked[gameId][defender][row][col] = true;

        // The core FHE operation: compare grid cell with encrypted 1
        euint8 gridCell = grids[gameId][defender][row][col];
        euint8 one = FHE.asEuint8(uint256(1));
        FHE.allowThis(one);

        ebool isHit;

        // If cell was never set (no ship), it's uninitialized (zero)
        // We need to handle this: uninitialized euint8 compared with 1 = false
        if (Common.isInitialized(gridCell)) {
            isHit = FHE.eq(gridCell, one);
        } else {
            // No ship here — trivially false
            isHit = FHE.asEbool(false);
        }
        FHE.allowThis(isHit);

        uint256 attackId = attackCount[gameId]++;
        attacks[gameId][attackId] = AttackRecord({
            attacker: msg.sender,
            row: row,
            col: col,
            resultHandle: isHit,
            resolved: false,
            isHit: false
        });

        emit AttackSubmitted(gameId, attackId, msg.sender, row, col);
    }

    /// @notice Resolve an attack by reading the decrypted result from CoFHE.
    /// @dev In mock/test environment, decryption is synchronous. On testnet, 
    ///      the CoFHE threshold network decrypts asynchronously.
    function resolveAttack(uint256 gameId, uint256 attackId) external {
        AttackRecord storage atk = attacks[gameId][attackId];
        require(!atk.resolved, "Already resolved");

        // Read the decrypted result (reverts if not yet decrypted)
        bool hit = FHE.getDecryptResult(atk.resultHandle);

        atk.resolved = true;
        atk.isHit = hit;

        if (hit) {
            address defender = _getOpponent(gameId, atk.attacker);
            if (defender == gamePlayer1[gameId]) {
                player1ShipsRemaining[gameId]--;
                if (player1ShipsRemaining[gameId] == 0) {
                    _finishGame(gameId, atk.attacker);
                }
            } else {
                player2ShipsRemaining[gameId]--;
                if (player2ShipsRemaining[gameId] == 0) {
                    _finishGame(gameId, atk.attacker);
                }
            }
        }

        // Switch turns if game not finished
        if (gamePhase[gameId] == Phase.BATTLE) {
            currentTurn[gameId] = _getOpponent(gameId, atk.attacker);
        }

        emit AttackResolved(gameId, attackId, hit);
    }

    // ══════════════════════════════════════════
    // VIEW FUNCTIONS
    // ══════════════════════════════════════════

    function getGameState(uint256 gameId) external view returns (
        Phase phase,
        address p1,
        address p2,
        address turn,
        uint8 p1Ships,
        uint8 p2Ships,
        address gameWinner,
        uint256 totalAttacks
    ) {
        return (
            gamePhase[gameId],
            gamePlayer1[gameId],
            gamePlayer2[gameId],
            currentTurn[gameId],
            player1ShipsRemaining[gameId],
            player2ShipsRemaining[gameId],
            winner[gameId],
            attackCount[gameId]
        );
    }

    function getAttack(uint256 gameId, uint256 attackId) external view returns (
        address attacker,
        uint8 row,
        uint8 col,
        bool resolved,
        bool isHit
    ) {
        AttackRecord storage atk = attacks[gameId][attackId];
        return (atk.attacker, atk.row, atk.col, atk.resolved, atk.isHit);
    }

    // ══════════════════════════════════════════
    // INTERNAL
    // ══════════════════════════════════════════

    function _isPlayer(uint256 gameId, address addr) internal view returns (bool) {
        return addr == gamePlayer1[gameId] || addr == gamePlayer2[gameId];
    }

    function _hasPlaced(uint256 gameId, address addr) internal view returns (bool) {
        if (addr == gamePlayer1[gameId]) return player1HasPlaced[gameId];
        return player2HasPlaced[gameId];
    }

    function _getOpponent(uint256 gameId, address addr) internal view returns (address) {
        if (addr == gamePlayer1[gameId]) return gamePlayer2[gameId];
        return gamePlayer1[gameId];
    }

    function _finishGame(uint256 gameId, address _winner) internal {
        gamePhase[gameId] = Phase.FINISHED;
        winner[gameId] = _winner;
        emit GameFinished(gameId, _winner);
    }
}
