import { useState, useMemo } from 'react';
import { GAME_PHASES, ORIENTATIONS, SHIPS, CELL_STATES, GRID_SIZE } from './constants.js';
import { 
  createEmptyGrid, 
  isValidPlacement, 
  placeShip, 
  processAttack, 
  checkWinCondition,
  placeShipsRandomly,
  getRandomPosition
} from './utils.js';
import './index.css';

function App() {
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.PLACEMENT);
  const [playerGrid, setPlayerGrid] = useState(createEmptyGrid());
  const [computerGrid, setComputerGrid] = useState(createEmptyGrid());
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState(ORIENTATIONS.HORIZONTAL);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [playerMoves, setPlayerMoves] = useState([]);
  const [computerMoves, setComputerMoves] = useState([]);
  const [playerSunkShips, setPlayerSunkShips] = useState([]);
  const [computerSunkShips, setComputerSunkShips] = useState([]);

  const handleCellClick = (row, col) => {
    if (gamePhase === GAME_PHASES.PLACEMENT) {
      handlePlacement(row, col);
    } else if (gamePhase === GAME_PHASES.PLAYING && isPlayerTurn) {
      handlePlayerAttack(row, col);
    }
  };

  const handlePlacement = (row, col) => {
    const ship = SHIPS[currentShipIndex];
    
    if (isValidPlacement(playerGrid, ship, row, col, orientation)) {
      const newGrid = placeShip(playerGrid, ship, row, col, orientation);
      setPlayerGrid(newGrid);
      
      if (currentShipIndex < SHIPS.length - 1) {
        setCurrentShipIndex(currentShipIndex + 1);
      } else {
        // All ships placed, start computer placement and game
        startGame();
      }
    }
  };

  const startGame = () => {
    const computerShipsGrid = placeShipsRandomly(createEmptyGrid());
    setComputerGrid(computerShipsGrid);
    setGamePhase(GAME_PHASES.PLAYING);
  };

  const handlePlayerAttack = (row, col) => {
    // Check if already attacked
    if (playerMoves.some(move => move.row === row && move.col === col)) {
      return;
    }

    const { grid: newComputerGrid, hit } = processAttack(computerGrid, row, col);
    setComputerGrid(newComputerGrid);
    setPlayerMoves([...playerMoves, { row, col, hit }]);

    // Check for newly sunk ships
    const newSunkShips = checkSunkShips(newComputerGrid, computerSunkShips);
    setComputerSunkShips(newSunkShips);

    if (checkWinCondition(newComputerGrid)) {
      setWinner('player');
      setGamePhase(GAME_PHASES.GAME_OVER);
      return;
    }

    setIsPlayerTurn(false);
    
    // Computer's turn after a short delay
    setTimeout(() => {
      handleComputerAttack();
    }, 500);
  };

  const handleComputerAttack = () => {
    let row, col;
    let validMove = false;
    
    // Find a valid move (not already attacked)
    while (!validMove) {
      const position = getRandomPosition();
      row = position.row;
      col = position.col;
      
      if (!computerMoves.some(move => move.row === row && move.col === col)) {
        validMove = true;
      }
    }

    const { grid: newPlayerGrid, hit } = processAttack(playerGrid, row, col);
    setPlayerGrid(newPlayerGrid);
    setComputerMoves([...computerMoves, { row, col, hit }]);

    // Check for newly sunk ships
    const newSunkShips = checkSunkShips(newPlayerGrid, playerSunkShips);
    setPlayerSunkShips(newSunkShips);

    if (checkWinCondition(newPlayerGrid)) {
      setWinner('computer');
      setGamePhase(GAME_PHASES.GAME_OVER);
      return;
    }

    setIsPlayerTurn(true);
  };

  const checkSunkShips = (grid, alreadySunk) => {
    const newlySunk = [];
    const hitCount = grid.flat().filter(cell => cell === CELL_STATES.HIT).length;
    
    // Simplified ship sinking logic based on hit count
    // This is a reasonable approximation for the simple data structure
    const shipsBySize = [...SHIPS].sort((a, b) => a.size - b.size);
    let remainingHits = hitCount;
    
    for (const ship of shipsBySize) {
      if (alreadySunk.includes(ship.name)) continue;
      
      if (remainingHits >= ship.size) {
        newlySunk.push(ship.name);
        remainingHits -= ship.size;
      }
    }
    
    return [...alreadySunk, ...newlySunk];
  };

  const resetGame = () => {
    setGamePhase(GAME_PHASES.PLACEMENT);
    setPlayerGrid(createEmptyGrid());
    setComputerGrid(createEmptyGrid());
    setCurrentShipIndex(0);
    setOrientation(ORIENTATIONS.HORIZONTAL);
    setIsPlayerTurn(true);
    setWinner(null);
    setPlayerMoves([]);
    setComputerMoves([]);
    setPlayerSunkShips([]);
    setComputerSunkShips([]);
  };

  const getCellClass = (cellState, isComputerGrid, row, col) => {
    let baseClass = 'w-8 h-8 border flex items-center justify-center cursor-pointer relative overflow-hidden';
    
    if (isComputerGrid) {
      const move = playerMoves.find(m => m.row === row && m.col === col);
      if (move) {
        baseClass += move.hit ? ' hit-cell border-red-400' : ' miss-cell border-blue-300';
      } else {
        baseClass += ' water-cell border-blue-400/50';
      }
    } else {
      const move = computerMoves.find(m => m.row === row && m.col === col);
      if (move) {
        baseClass += move.hit ? ' hit-cell border-red-400' : ' miss-cell border-blue-300';
      } else if (cellState === CELL_STATES.SHIP) {
        baseClass += ' ship-cell border-gray-500';
      } else {
        baseClass += ' water-cell border-blue-400/50';
      }
    }
    
    return baseClass;
  };

  const renderGrid = (grid, isComputerGrid) => {
    return (
      <div className="flex flex-col gap-1">
        {/* Column headers */}
        <div className="flex justify-center gap-1 mb-1">
          <div className="w-8"></div> {/* Corner spacer */}
          {Array.from({ length: GRID_SIZE }, (_, i) => (
            <div key={`col-${i}`} className="coordinate-label text-center py-1 w-8">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        
        <div className="flex gap-1">
          {/* Row numbers */}
          <div className="flex flex-col gap-1 mr-1">
            {Array.from({ length: GRID_SIZE }, (_, i) => (
              <div key={`row-${i}`} className="coordinate-label text-center py-2 w-8">
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-10 gap-0 border-2 border-blue-400/50 rounded-lg overflow-hidden ocean-grid">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClass(cell, isComputerGrid, rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderShipStatus = (ships, sunkShips, isPlayer) => {
    const activeShips = ships.filter(ship => !sunkShips.includes(ship.name));
    const destroyedShips = ships.filter(ship => sunkShips.includes(ship.name));
    
    return (
      <div className="glass-panel rounded-xl p-4 mt-4">
        <h3 className="text-lg font-semibold text-blue-200 mb-3">
          {isPlayer ? '🫥 FLEET STATUS' : '🎯 ENEMY INTEL'}
        </h3>
        
        {/* Active Ships */}
        <div className="mb-4">
          <div className="text-green-400 text-sm font-medium mb-2">
            ● ACTIVE ({activeShips.length})
          </div>
          <div className="space-y-2">
            {activeShips.map((ship) => (
              <div key={ship.name} className="ship-status-item">
                <div className="ship-icon flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {ship.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{ship.name}</div>
                  <div className="text-blue-300 text-sm">Size: {ship.size}</div>
                </div>
                <div className="text-green-400 text-sm font-medium">
                  OPERATIONAL
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Destroyed Ships */}
        {destroyedShips.length > 0 && (
          <div>
            <div className="text-red-400 text-sm font-medium mb-2">
              ☠ DESTROYED ({destroyedShips.length})
            </div>
            <div className="space-y-2">
              {destroyedShips.map((ship) => (
                <div key={ship.name} className="ship-status-item ship-sunk">
                  <div className="ship-icon flex items-center justify-center opacity-50">
                    <span className="text-white text-xs font-bold">
                      {ship.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium line-through">{ship.name}</div>
                    <div className="text-blue-300 text-sm">Size: {ship.size}</div>
                  </div>
                  <div className="text-red-400 text-sm font-medium">
                    SUNK
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl wave-animation"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl wave-animation" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl wave-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 mb-2 wave-animation">
            ⚓ BATTLESHIP ⚓
          </h1>
          <p className="text-blue-200 text-lg">Tactical Naval Combat System</p>
        </div>
        
        {/* Game Phase Panels */}
        {gamePhase === GAME_PHASES.PLACEMENT && (
          <div className="text-center mb-6 glass-panel rounded-xl p-6 max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-blue-100 mb-4">
              Deploy your {SHIPS[currentShipIndex].name} (Size: {SHIPS[currentShipIndex].size})
            </h2>
            <button
              onClick={() => setOrientation(
                orientation === ORIENTATIONS.HORIZONTAL 
                  ? ORIENTATIONS.VERTICAL 
                  : ORIENTATIONS.HORIZONTAL
              )}
              className="naval-button px-8 py-3 rounded-lg mb-4"
            >
              Orientation: {orientation === 'horizontal' ? '↔ Horizontal' : '↕ Vertical'}
            </button>
            <p className="text-blue-200 mt-3">Click on the grid to deploy your vessel</p>
            <div className="mt-4 text-sm text-blue-300">
              Ships remaining: {SHIPS.length - currentShipIndex}
            </div>
          </div>
        )}

        {gamePhase === GAME_PHASES.PLAYING && (
          <div className="text-center mb-6 glass-panel rounded-xl p-6 max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-blue-100">
              {isPlayerTurn ? "⚔️ YOUR TURN - FIRE AT WILL!" : "🤖 ENEMY TURN - STAND BY..."}
            </h2>
          </div>
        )}

        {gamePhase === GAME_PHASES.GAME_OVER && (
          <div className="text-center mb-6 glass-panel rounded-xl p-8 max-w-lg mx-auto">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
              {winner === 'player' ? '🎉 VICTORY!' : '💥 DEFEAT!'}
            </h2>
            <p className="text-blue-200 mb-6">
              {winner === 'player' 
                ? 'You have destroyed the enemy fleet!' 
                : 'Your fleet has been destroyed...'}
            </p>
            <button
              onClick={resetGame}
              className="naval-button px-8 py-3 rounded-lg"
            >
              🔄 NEW MISSION
            </button>
          </div>
        )}

        {/* Game Grids and Status */}
        <div className="flex justify-center gap-8 flex-wrap">
          {/* Player Grid */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-blue-200 mb-3">🫥 YOUR FLEET</h3>
            <div className="glass-panel rounded-xl p-4 inline-block">
              {renderGrid(playerGrid, false)}
            </div>
            {renderShipStatus(SHIPS, playerSunkShips, true)}
          </div>
          
          {/* Computer Grid */}
          {gamePhase !== GAME_PHASES.PLACEMENT && (
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-blue-200 mb-3">🎯 ENEMY FLEET</h3>
              <div className="glass-panel rounded-xl p-4 inline-block">
                {renderGrid(computerGrid, true)}
              </div>
              {renderShipStatus(SHIPS, computerSunkShips, false)}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <button
            onClick={resetGame}
            className="naval-button px-6 py-2 rounded-lg"
          >
            🔄 ABORT MISSION
          </button>
        </div>

        {/* Legend */}
        <div className="mt-8 max-w-lg mx-auto glass-panel rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-200 mb-4">📋 TACTICAL DISPLAY</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 ship-cell rounded"></div>
              <span className="text-blue-100">Your Vessel</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 water-cell rounded"></div>
              <span className="text-blue-100">Open Water</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 hit-cell rounded"></div>
              <span className="text-blue-100">Direct Hit</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 miss-cell rounded"></div>
              <span className="text-blue-100">Miss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;