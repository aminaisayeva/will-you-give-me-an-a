"use client";

import { motion } from "framer-motion";
import { RotateCcw, Lightbulb, Trophy } from "lucide-react";
import { useState } from "react";

// Simple 4x4 Sudoku for demo purposes
const initialBoard = [
  [1, 0, 0, 4],
  [0, 4, 1, 0],
  [0, 1, 4, 0],
  [4, 0, 0, 1]
];

const solution = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1]
];

export default function SudokuWindow() {
  const [board, setBoard] = useState(initialBoard.map(row => [...row]));
  const [isComplete, setIsComplete] = useState(false);

  const handleCellChange = (row: number, col: number, value: string) => {
    const newValue = value === '' ? 0 : parseInt(value);
    if (isNaN(newValue) || newValue < 0 || newValue > 4) return;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = newValue;
    setBoard(newBoard);
    
    // Check if puzzle is complete
    const isCorrect = newBoard.every((row, i) => 
      row.every((cell, j) => cell === solution[i][j])
    );
    
    if (isCorrect) {
      setIsComplete(true);
    }
  };

  const resetBoard = () => {
    setBoard(initialBoard.map(row => [...row]));
    setIsComplete(false);
  };

  const showHint = () => {
    // Find first empty cell and fill it with correct value
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          const newBoard = board.map(r => [...r]);
          newBoard[i][j] = solution[i][j];
          setBoard(newBoard);
          if (newBoard.every((r, ri) => r.every((cell, ci) => cell === solution[ri][ci]))) {
            setIsComplete(true);
          }
          return;
        }
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">4x4 Sudoku</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Fill each row, column, and 2x2 box with numbers 1-4
          </p>
        </div>

        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-6 text-center"
          >
            <Trophy className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-green-800 dark:text-green-200">Congratulations!</h2>
            <p className="text-green-700 dark:text-green-300">You&apos;ve completed the puzzle!</p>
          </motion.div>
        )}

        {/* Sudoku Grid */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-1 w-80 h-80 mx-auto bg-gray-800 dark:bg-gray-600 p-2 rounded-lg">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isInitial = initialBoard[rowIndex][colIndex] !== 0;
                const hasThickBorder = (rowIndex === 1 && colIndex < 2) || 
                                     (colIndex === 1 && rowIndex < 2) ||
                                     (rowIndex === 3 && colIndex >= 2) || 
                                     (colIndex === 3 && rowIndex >= 2);
                
                return (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    type="text"
                    value={cell === 0 ? '' : cell.toString()}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    disabled={isInitial}
                    className={`
                      w-full h-full text-center text-xl font-bold border-2 rounded
                      ${isInitial 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                        : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                      }
                      ${hasThickBorder ? 'border-gray-800 dark:border-gray-400' : 'border-gray-400 dark:border-gray-600'}
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    `}
                    maxLength={1}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <motion.button
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetBoard}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
          
          <motion.button
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={showHint}
            disabled={isComplete}
          >
            <Lightbulb className="w-4 h-4" />
            Hint
          </motion.button>
        </div>

      </div>
  );
}
