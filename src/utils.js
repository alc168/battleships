import { GRID_SIZE, CELL_STATES, SHIPS } from './constants.js';

export const createEmptyGrid = () => {
  return Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(CELL_STATES.EMPTY)
  );
};

export const isValidPlacement = (grid, ship, row, col, orientation) => {
  const { size } = ship;
  
  // Check if ship fits within grid bounds
  if (orientation === 'horizontal') {
    if (col + size > GRID_SIZE) {
      return false;
    }
  } else {
    if (row + size > GRID_SIZE) {
      return false;
    }
  }
  
  // Check for overlapping ships
  for (let i = 0; i < size; i++) {
    const checkRow = orientation === 'horizontal' ? row : row + i;
    const checkCol = orientation === 'horizontal' ? col + i : col;
    
    if (grid[checkRow][checkCol] !== CELL_STATES.EMPTY) {
      return false;
    }
  }
  
  return true;
};

export const placeShip = (grid, ship, row, col, orientation) => {
  const newGrid = grid.map(row => [...row]);
  const { size } = ship;
  
  for (let i = 0; i < size; i++) {
    const placeRow = orientation === 'horizontal' ? row : row + i;
    const placeCol = orientation === 'horizontal' ? col + i : col;
    newGrid[placeRow][placeCol] = CELL_STATES.SHIP;
  }
  
  return newGrid;
};

export const placeShipWithTracking = (grid, ship, row, col, orientation, shipPositions) => {
  const newGrid = grid.map(row => [...row]);
  const { size, name } = ship;
  const positions = [];
  
  for (let i = 0; i < size; i++) {
    const placeRow = orientation === 'horizontal' ? row : row + i;
    const placeCol = orientation === 'horizontal' ? col + i : col;
    newGrid[placeRow][placeCol] = CELL_STATES.SHIP;
    positions.push({ row: placeRow, col: placeCol });
  }
  
  return { 
    grid: newGrid, 
    shipPositions: [...shipPositions, { name, positions }] 
  };
};

export const processAttack = (grid, row, col) => {
  const newGrid = grid.map(row => [...row]);
  const cellState = newGrid[row][col];
  
  if (cellState === CELL_STATES.SHIP) {
    newGrid[row][col] = CELL_STATES.HIT;
    return { grid: newGrid, hit: true };
  } else if (cellState === CELL_STATES.EMPTY) {
    newGrid[row][col] = CELL_STATES.MISS;
    return { grid: newGrid, hit: false };
  }
  
  // Already attacked this cell
  return { grid: newGrid, hit: null };
};

export const checkWinCondition = (grid) => {
  return !grid.some(row => row.includes(CELL_STATES.SHIP));
};

export const getRandomPosition = () => {
  return {
    row: Math.floor(Math.random() * GRID_SIZE),
    col: Math.floor(Math.random() * GRID_SIZE),
  };
};

export const getRandomOrientation = () => {
  return Math.random() > 0.5 ? 'horizontal' : 'vertical';
};

export const placeShipsRandomly = (grid) => {
  let newGrid = grid.map(row => [...row]);
  
  for (const ship of SHIPS) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      const { row, col } = getRandomPosition();
      const orientation = getRandomOrientation();
      
      if (isValidPlacement(newGrid, ship, row, col, orientation)) {
        newGrid = placeShip(newGrid, ship, row, col, orientation);
        placed = true;
      }
      
      attempts++;
    }
    
    if (!placed) {
      console.error(`Could not place ${ship.name} after ${maxAttempts} attempts`);
    }
  }
  
  return newGrid;
};

export const placeShipsRandomlyWithTracking = (grid) => {
  let newGrid = grid.map(row => [...row]);
  let shipPositions = [];
  
  for (const ship of SHIPS) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      const { row, col } = getRandomPosition();
      const orientation = getRandomOrientation();
      
      if (isValidPlacement(newGrid, ship, row, col, orientation)) {
        const result = placeShipWithTracking(newGrid, ship, row, col, orientation, shipPositions);
        newGrid = result.grid;
        shipPositions = result.shipPositions;
        placed = true;
      }
      
      attempts++;
    }
    
    if (!placed) {
      console.error(`Could not place ${ship.name} after ${maxAttempts} attempts`);
    }
  }
  
  return { grid: newGrid, shipPositions };
};

export const checkSunkShips = (shipPositions, hits) => {
  const sunkShips = [];
  
  for (const ship of shipPositions) {
    const allPositionsHit = ship.positions.every(pos => 
      hits.some(hit => hit.row === pos.row && hit.col === pos.col)
    );
    
    if (allPositionsHit) {
      sunkShips.push(ship.name);
    }
  }
  
  return sunkShips;
};