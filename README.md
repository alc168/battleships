# Battleship

A modern, elegant implementation of the classic Battleship naval combat game built with React, Vite, and Tailwind CSS.

## Features

- **Interactive Gameplay**: Place your ships strategically on a 10x10 grid and battle against the computer
- **Smart AI**: Computer opponent with random ship placement and attack strategy
- **Clean UI**: Modern, responsive design with smooth animations and visual feedback
- **Simple State Management**: Built with React Hooks for maintainable, readable code
- **Production Ready**: Optimized build with Vite for fast loading and performance

## How to Play

1. **Ship Placement**: Click on the grid to place your 5 ships (Carrier, Battleship, Cruiser, Submarine, Destroyer)
2. **Orientation**: Toggle between horizontal and vertical placement using the orientation button
3. **Attack**: Once all ships are placed, click on the computer's grid to attack
4. **Win Condition**: Sink all enemy ships before they sink yours!

## Tech Stack

- **React 19**: Modern React with latest features
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS for rapid UI development
- **React Hooks**: Simple state management without complex libraries

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.jsx          # Main game component
├── constants.js     # Game constants and configuration
├── utils.js         # Game logic and utility functions
├── main.jsx         # Application entry point
└── index.css        # Tailwind CSS imports
```

## Game Logic

The game uses simple, elegant data structures:
- **Grid**: 10x10 array representing the game board
- **Cell States**: Empty, Ship, Hit, Miss, Sunk
- **Game Phases**: Placement, Playing, Game Over
- **Ship Configuration**: Array of ship objects with name and size

## Deployment

This project is designed for easy deployment to Vercel, Netlify, or GitHub Pages. The build output is optimized for static hosting.

## License

MIT
