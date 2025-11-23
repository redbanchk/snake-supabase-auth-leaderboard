import React from 'react';
import { SnakeGame } from './components/SnakeGame';

const App: React.FC = () => {
  return (
    <main className="w-full h-screen bg-game-bg flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      <SnakeGame />
    </main>
  );
};

export default App;
