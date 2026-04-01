import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Play, RotateCcw, Trophy, Pause, Gamepad2, Settings2 } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { Difficulty } from './types';

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [playerSpeed, setPlayerSpeed] = useState(7);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('neon-nebula-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon-nebula-highscore', score.toString());
    }
  }, [score, highScore]);

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('gameover');
  };

  const startGame = () => {
    setGameState('playing');
    setIsPaused(false);
    setScore(0);
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-8"
            >
              <Rocket size={120} className="text-[#00d4ff] drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]" />
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter italic uppercase">
              NEON <span className="text-[#00d4ff]">NEBULA</span>
            </h1>
            <p className="text-gray-400 mb-12 max-w-md text-lg">
              네온 무리로부터 은하계를 지키세요. 마우스로 기체를 움직이고 클릭하여 발사하세요.
              <br />
              <span className="text-[#00d4ff] font-bold">[Q]</span> 키를 눌러 모든 적을 섬멸하는 필살기를 사용하세요!
            </p>

            <div className="flex flex-col gap-6 w-full max-w-xs">
              <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#00d4ff] mb-3 uppercase tracking-widest">
                  <Settings2 size={14} /> 난이도 선택
                </div>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        difficulty === d
                          ? 'bg-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                      }`}
                    >
                      {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#00d4ff] mb-3 uppercase tracking-widest">
                  <Gamepad2 size={14} /> 기체 속도
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '느림', value: 5 },
                    { label: '보통', value: 7 },
                    { label: '빠름', value: 10 }
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setPlayerSpeed(s.value)}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        playerSpeed === s.value
                          ? 'bg-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startGame}
                className="group relative px-8 py-4 bg-white text-black font-bold text-xl rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-[#00d4ff] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Play fill="currentColor" /> 미션 시작
                </span>
              </button>
              
              {highScore > 0 && (
                <div className="flex items-center justify-center gap-2 text-gray-500 font-mono">
                  <Trophy size={16} /> 최고 기록: {highScore.toString().padStart(6, '0')}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full relative"
          >
            <GameCanvas 
              onGameOver={handleGameOver} 
              isPaused={isPaused} 
              difficulty={difficulty} 
              highScore={highScore} 
              playerSpeed={playerSpeed}
            />
            
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
            >
              {isPaused ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}
            </button>

            {isPaused && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-6xl font-black mb-8 italic">일시 정지</h2>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-4 bg-[#00d4ff] text-black font-bold text-xl rounded-full hover:scale-105 transition-transform"
                  >
                    재개
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <h2 className="text-8xl font-black mb-2 text-red-500 italic uppercase">미션 실패</h2>
            <div className="text-4xl font-mono mb-12">최종 점수: {score.toString().padStart(6, '0')}</div>
            
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button
                onClick={startGame}
                className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full flex items-center justify-center gap-2 hover:bg-[#00d4ff] transition-colors"
              >
                <RotateCcw /> 다시 시도
              </button>
              <button
                onClick={() => setGameState('start')}
                className="px-8 py-4 border-2 border-white/20 font-bold text-xl rounded-full hover:bg-white/10 transition-colors"
              >
                메인 메뉴
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative elements */}
      <div className="fixed bottom-4 right-4 opacity-20 pointer-events-none flex items-center gap-2 text-xs font-mono">
        <Gamepad2 size={14} /> NEON NEBULA RAIDER v1.0
      </div>
    </div>
  );
}
