import { useState, useMemo } from 'react';
import { GAME_PHASES, ORIENTATIONS, SHIPS, CELL_STATES, GRID_SIZE, APP_VERSION } from './constants.js';
import { 
  createEmptyGrid, 
  isValidPlacement, 
  placeShip, 
  placeShipWithTracking,
  processAttack, 
  checkWinCondition,
  placeShipsRandomlyWithTracking,
  getRandomPosition,
  checkSunkShips
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
  const [playerPlacedShips, setPlayerPlacedShips] = useState([]);
  const [playerShipPositions, setPlayerShipPositions] = useState([]);
  const [computerShipPositions, setComputerShipPositions] = useState([]);

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
      const result = placeShipWithTracking(playerGrid, ship, row, col, orientation, playerShipPositions);
      
      setPlayerGrid(result.grid);
      setPlayerShipPositions(result.shipPositions);
      setPlayerPlacedShips(prev => [...prev, ship.name]);
      
      if (currentShipIndex < SHIPS.length - 1) {
        setCurrentShipIndex(prev => prev + 1);
      } else {
        startGame();
      }
    }
  };

  const startGame = () => {
    const result = placeShipsRandomlyWithTracking(createEmptyGrid());
    setComputerGrid(result.grid);
    setComputerShipPositions(result.shipPositions);
    setGamePhase(GAME_PHASES.PLAYING);
  };

  const handlePlayerAttack = (row, col) => {
    // Check if already attacked
    if (playerMoves.some(move => move.row === row && move.col === col)) {
      return;
    }

    const { grid: newComputerGrid, hit } = processAttack(computerGrid, row, col);
    const updatedMoves = [...playerMoves, { row, col, hit }];
    
    setComputerGrid(newComputerGrid);
    setPlayerMoves(updatedMoves);

    // Check for newly sunk ships using updated moves (including this hit)
    const newSunkShips = checkSunkShips(computerShipPositions, updatedMoves);
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
    const updatedMoves = [...computerMoves, { row, col, hit }];
    
    setPlayerGrid(newPlayerGrid);
    setComputerMoves(updatedMoves);

    // Check for newly sunk ships using updated moves (including this hit)
    const newSunkShips = checkSunkShips(playerShipPositions, updatedMoves);
    setPlayerSunkShips(newSunkShips);

    if (checkWinCondition(newPlayerGrid)) {
      setWinner('computer');
      setGamePhase(GAME_PHASES.GAME_OVER);
      return;
    }

    setIsPlayerTurn(true);
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
    setPlayerPlacedShips([]);
    setPlayerShipPositions([]);
    setComputerShipPositions([]);
  };

  const isCellOfSunkShip = (isComputerGrid, row, col) => {
    if (isComputerGrid) {
      return computerShipPositions.some(ship => 
        computerSunkShips.includes(ship.name) &&
        ship.positions.some(pos => pos.row === row && pos.col === col)
      );
    } else {
      return playerShipPositions.some(ship => 
        playerSunkShips.includes(ship.name) &&
        ship.positions.some(pos => pos.row === row && pos.col === col)
      );
    }
  };

  const getCellClass = (cellState, isComputerGrid, row, col) => {
    let baseClass = 'w-6 h-6 border flex items-center justify-center cursor-pointer relative overflow-hidden';
    const isSunk = isCellOfSunkShip(isComputerGrid, row, col);
    
    if (isComputerGrid) {
      const move = playerMoves.find(m => m.row === row && m.col === col);
      if (move) {
        if (isSunk) {
          baseClass += ' sunk-cell border-red-700';
        } else if (move.hit) {
          baseClass += ' hit-cell border-red-500';
        } else {
          baseClass += ' miss-cell border-yellow-400';
        }
      } else {
        baseClass += ' tactical-cell border-green-600/30';
      }
    } else {
      const move = computerMoves.find(m => m.row === row && m.col === col);
      if (move) {
        if (isSunk) {
          baseClass += ' sunk-cell border-red-700';
        } else if (move.hit) {
          baseClass += ' hit-cell border-red-500';
        } else {
          baseClass += ' miss-cell border-yellow-400';
        }
      } else if (cellState === CELL_STATES.SHIP) {
        baseClass += ' ship-cell border-gray-500';
      } else {
        baseClass += ' tactical-cell border-green-600/30';
      }
    }
    
    return baseClass;
  };

  const getCellContent = (cellState, isComputerGrid, row, col) => {
    const isSunk = isCellOfSunkShip(isComputerGrid, row, col);
    
    if (isComputerGrid) {
      const move = playerMoves.find(m => m.row === row && m.col === col);
      if (move && !move.hit) {
        return <span className="text-yellow-900 font-bold text-sm">×</span>;
      }
      if (move && move.hit && isSunk) {
        return <span className="skull-icon">☠</span>;
      }
    } else {
      const move = computerMoves.find(m => m.row === row && m.col === col);
      if (move && !move.hit) {
        return <span className="text-yellow-900 font-bold text-sm">×</span>;
      }
      if (move && move.hit && isSunk) {
        return <span className="skull-icon">☠</span>;
      }
    }
    return null;
  };

  const renderGrid = (grid, isComputerGrid) => {
    return (
      <div className="flex flex-col gap-0.5">
        {/* Column headers */}
        <div className="flex justify-center gap-0.5 mb-0.5">
          <div className="w-5"></div> {/* Corner spacer */}
          {Array.from({ length: GRID_SIZE }, (_, i) => (
            <div key={`col-${isComputerGrid ? 'enemy' : 'player'}-${i}`} className="coordinate-label text-center py-0.5 w-5">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        
        <div className="flex gap-0.5">
          {/* Row numbers */}
          <div className="flex flex-col gap-0.5 mr-0.5">
            {Array.from({ length: GRID_SIZE }, (_, i) => (
              <div key={`row-${isComputerGrid ? 'enemy' : 'player'}-${i}`} className="coordinate-label text-center py-1.5 w-5">
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="relative grid grid-cols-10 gap-0 border-2 border-green-500/30 rounded-lg overflow-hidden radar-grid">
            <div className="radar-sweep"></div>
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${isComputerGrid ? 'enemy' : 'player'}-${rowIndex * GRID_SIZE + colIndex}`}
                  className={getCellClass(cell, isComputerGrid, rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {getCellContent(cell, isComputerGrid, rowIndex, colIndex)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderShipStatus = (ships, sunkShips, placedShips, isPlayer) => {
    return (
      <div className="operations-panel rounded-lg p-2">
        <h3 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">
          {isPlayer ? 'Friendly Fleet' : 'Enemy Contacts'}
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {ships.map((ship, index) => {
            const isSunk = sunkShips.includes(ship.name);
            const isPlaced = placedShips.includes(ship.name);
            
            let status = 'pending';
            if (isSunk) status = 'sunk';
            else if (isPlaced) status = 'operational';
            
            return (
              <div key={`${isPlayer ? 'player' : 'enemy'}-${index}-${ship.name}-${status}`} className={`ship-status-compact ${status}`}>
                <span className="font-bold">{ship.name.charAt(0)}</span>
                <span className="flex-1 truncate">{ship.name}</span>
                <span className="text-xs">
                  {status === 'pending' ? '⏳' : status === 'operational' ? '✓' : '☠'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="screen-fit operations-room">
      {/* Header */}
      <div className="header-compact relative">
        <h1 className="text-2xl font-bold text-green-400 tracking-wider">
          ⚔️ BATTLESHIPS ⚔️
        </h1>
        <div className="absolute top-0 right-4 text-xs text-green-600 font-mono">
          v{APP_VERSION}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="status-bar">
        <div className="flex items-center gap-4">
          {gamePhase === GAME_PHASES.PLACEMENT && (
            <>
              <span className="text-green-300 text-sm">
                DEPLOY: {SHIPS[currentShipIndex].name} ({SHIPS[currentShipIndex].size})
              </span>
              <button
                onClick={() => setOrientation(
                  orientation === ORIENTATIONS.HORIZONTAL 
                    ? ORIENTATIONS.VERTICAL 
                    : ORIENTATIONS.HORIZONTAL
                )}
                className="tactical-button px-3 py-1 rounded text-xs"
              >
                {orientation === 'horizontal' ? 'HORIZ' : 'VERT'}
              </button>
            </>
          )}
          {gamePhase === GAME_PHASES.PLAYING && (
            <span className="text-green-300 text-sm">
              {isPlayerTurn ? "⚔️ YOUR TURN" : "🤖 ENEMY TURN"}
            </span>
          )}
          {gamePhase === GAME_PHASES.GAME_OVER && (
            <span className={`text-sm font-bold ${winner === 'player' ? 'text-green-400' : 'text-red-400'}`}>
              {winner === 'player' ? '🎉 MISSION ACCOMPLISHED' : '💥 MISSION FAILED'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetGame}
            className="tactical-button px-3 py-1 rounded text-xs"
          >
            🔄 RESET
          </button>
          {gamePhase === GAME_PHASES.GAME_OVER && (
            <button
              onClick={resetGame}
              className="tactical-button px-3 py-1 rounded text-xs"
            >
              🎯 NEW MISSION
            </button>
          )}
        </div>
      </div>
      
      {/* Game Area */}
      <div className="game-area">
        {/* Player Grid */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
            Friendly Waters
          </h3>
          {renderGrid(playerGrid, false)}
          {renderShipStatus(SHIPS, playerSunkShips, playerPlacedShips, true)}
        </div>
        
        {/* Computer Grid */}
        {gamePhase !== GAME_PHASES.PLACEMENT && (
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
              Enemy Waters
            </h3>
            {renderGrid(computerGrid, true)}
            {renderShipStatus(SHIPS, computerSunkShips, gamePhase === GAME_PHASES.PLAYING ? SHIPS.map(s => s.name) : [], false)}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="h-12 flex items-center justify-center gap-6 operations-panel rounded-lg px-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 ship-cell rounded"></div>
          <span className="text-green-300 text-xs">SHIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 tactical-cell rounded"></div>
          <span className="text-green-300 text-xs">WATER</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 hit-cell rounded"></div>
          <span className="text-green-300 text-xs">HIT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 miss-cell rounded"></div>
          <span className="text-green-300 text-xs">MISS</span>
        </div>
      </div>
    </div>
  );
}

export default App;