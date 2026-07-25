import { useState } from 'react';
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
  };

  const getCellClass = (cellState, isComputerGrid, row, col) => {
    let baseClass = 'w-8 h-8 border border-gray-300 flex items-center justify-center cursor-pointer transition-all duration-200';
    
    if (isComputerGrid) {
      const move = playerMoves.find(m => m.row === row && m.col === col);
      if (move) {
        baseClass += move.hit ? ' bg-red-500 hover:bg-red-600' : ' bg-blue-300 hover:bg-blue-400';
      } else {
        baseClass += ' bg-gray-50 hover:bg-gray-200';
      }
    } else {
      const move = computerMoves.find(m => m.row === row && m.col === col);
      if (move) {
        baseClass += move.hit ? ' bg-red-500 hover:bg-red-600' : ' bg-blue-300 hover:bg-blue-400';
      } else if (cellState === CELL_STATES.SHIP) {
        baseClass += ' bg-gray-700 hover:bg-gray-800';
      } else {
        baseClass += ' bg-gray-50 hover:bg-gray-200';
      }
    }
    
    return baseClass;
  };

  const renderGrid = (grid, isComputerGrid) => {
    return (
      <div className="grid grid-cols-10 gap-0 border-2 border-gray-400">
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
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-2">Battleship</h1>
        <p className="text-center text-gray-600 mb-8">Classic naval combat game</p>
        
        {gamePhase === GAME_PHASES.PLACEMENT && (
          <div className="text-center mb-6 bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Place your {SHIPS[currentShipIndex].name} (Size: {SHIPS[currentShipIndex].size})
            </h2>
            <button
              onClick={() => setOrientation(
                orientation === ORIENTATIONS.HORIZONTAL 
                  ? ORIENTATIONS.VERTICAL 
                  : ORIENTATIONS.HORIZONTAL
              )}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Orientation: {orientation}
            </button>
            <p className="mt-3 text-gray-600">Click on the grid to place your ship</p>
            <div className="mt-4 text-sm text-gray-500">
              Ships remaining: {SHIPS.length - currentShipIndex}
            </div>
          </div>
        )}

        {gamePhase === GAME_PHASES.PLAYING && (
          <div className="text-center mb-6 bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-700">
              {isPlayerTurn ? "⚔️ Your Turn - Attack!" : "🤖 Computer's Turn..."}
            </h2>
          </div>
        )}

        {gamePhase === GAME_PHASES.GAME_OVER && (
          <div className="text-center mb-6 bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {winner === 'player' ? '🎉 You Win!' : '💥 Computer Wins!'}
            </h2>
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}

        <div className="flex justify-center gap-8 flex-wrap">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Your Fleet</h3>
            <div className="bg-white rounded-xl shadow-lg p-4 inline-block">
              {renderGrid(playerGrid, false)}
            </div>
          </div>
          
          {gamePhase !== GAME_PHASES.PLACEMENT && (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Computer Fleet</h3>
              <div className="bg-white rounded-xl shadow-lg p-4 inline-block">
                {renderGrid(computerGrid, true)}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-8 flex-wrap">
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg"
          >
            Reset Game
          </button>
        </div>

        <div className="mt-8 max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-700 border border-gray-300"></div>
              <span className="text-gray-600">Your Ship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-50 border border-gray-300"></div>
              <span className="text-gray-600">Empty Water</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 border border-gray-300"></div>
              <span className="text-gray-600">Hit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-300 border border-gray-300"></div>
              <span className="text-gray-600">Miss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;