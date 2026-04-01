import React, { useEffect, useRef, useState } from 'react';
import { Bullet, Enemy, Particle, Difficulty, WeaponType } from '../types';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
  difficulty: Difficulty;
  highScore: number;
  playerSpeed: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, isPaused, difficulty, highScore, playerSpeed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  
  // Game state refs for the loop
  const playerRef = useRef({ x: 0, y: 0, width: 40, height: 40 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const lastShotTimeRef = useRef(0);
  const ultimateChargeRef = useRef(0);
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const ultimateFlashRef = useRef(0); // 0 to 1 for flash effect
  const isUltimateActiveRef = useRef(false);
  const ultimateTimeRemainingRef = useRef(0);
  const [ultimateTimeRemaining, setUltimateTimeRemaining] = useState(0);
  const currentWeaponRef = useRef<WeaponType>('pistol');
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('pistol');
  const keysPressedRef = useRef<Record<string, boolean>>({});

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    playerRef.current = {
      x: canvas.width / 2 - 20,
      y: canvas.height - 80,
      width: 40,
      height: 40
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    ultimateChargeRef.current = 0;
    isUltimateActiveRef.current = false;
    ultimateTimeRemainingRef.current = 0;
    currentWeaponRef.current = 'pistol';
    setCurrentWeapon('pistol');
    setUltimateCharge(0);
    setUltimateTimeRemaining(0);
    setScore(0);
    frameCountRef.current = 0;
  };

  const spawnEnemy = (canvas: HTMLCanvasElement) => {
    const type = Math.random() > 0.8 ? (Math.random() > 0.5 ? 'tank' : 'fast') : 'basic';
    const width = type === 'tank' ? 60 : 30;
    const height = type === 'tank' ? 60 : 30;
    
    // Difficulty multipliers
    const speedMult = difficulty === 'hard' ? 1.5 : (difficulty === 'easy' ? 0.7 : 1);
    const hpMult = difficulty === 'hard' ? 2 : (difficulty === 'easy' ? 0.5 : 1);

    const speed = (type === 'fast' ? 5 : (type === 'tank' ? 1.5 : 3)) * speedMult;
    const hp = Math.ceil((type === 'tank' ? 5 : 1) * hpMult);

    enemiesRef.current.push({
      x: Math.random() * (canvas.width - width),
      y: -height,
      width,
      height,
      speed,
      hp,
      maxHp: hp,
      type,
      color: type === 'tank' ? '#ff0055' : (type === 'fast' ? '#00ffcc' : '#ffcc00')
    });
  };

  const createExplosion = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (count > 10 ? 20 : 10),
        vy: (Math.random() - 0.5) * (count > 10 ? 20 : 10),
        width: count > 10 ? 6 : 4,
        height: count > 10 ? 6 : 4,
        color,
        life: 1,
        opacity: 1
      });
    }
  };

  const triggerUltimate = () => {
    if (ultimateChargeRef.current < 100 || isUltimateActiveRef.current) return;

    isUltimateActiveRef.current = true;
    ultimateTimeRemainingRef.current = 15 * 60; // 15 seconds at 60fps
    setUltimateTimeRemaining(15);
    ultimateFlashRef.current = 1;
    
    ultimateChargeRef.current = 0;
    setUltimateCharge(0);
  };

  const update = () => {
    if (isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Player movement with WASD
    if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) {
      playerRef.current.y -= playerSpeed;
    }
    if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) {
      playerRef.current.y += playerSpeed;
    }
    if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) {
      playerRef.current.x -= playerSpeed;
    }
    if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) {
      playerRef.current.x += playerSpeed;
    }

    // Boundary checks
    playerRef.current.x = Math.max(0, Math.min(canvas.width - playerRef.current.width, playerRef.current.x));
    playerRef.current.y = Math.max(0, Math.min(canvas.height - playerRef.current.height, playerRef.current.y));

    frameCountRef.current++;
    if (ultimateFlashRef.current > 0) {
      ultimateFlashRef.current -= 0.05;
    }

    if (isUltimateActiveRef.current) {
      ultimateTimeRemainingRef.current--;
      if (frameCountRef.current % 60 === 0) {
        setUltimateTimeRemaining(Math.ceil(ultimateTimeRemainingRef.current / 60));
      }

      // Continuous screen clear during ultimate
      enemiesRef.current.forEach(e => {
        createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color, 10);
        const points = (e.type === 'tank' ? 100 : (e.type === 'fast' ? 50 : 20));
        scoreRef.current += points;
      });
      enemiesRef.current = [];
      setScore(scoreRef.current);

      if (ultimateTimeRemainingRef.current <= 0) {
        isUltimateActiveRef.current = false;
        setUltimateTimeRemaining(0);
      }
    }

    // Spawn enemies
    const difficultySpawnRate = difficulty === 'hard' ? 0.7 : (difficulty === 'easy' ? 1.5 : 1);
    const spawnRate = Math.max(10, Math.floor((60 - Math.floor(scoreRef.current / 500) * 5) * difficultySpawnRate));
    if (frameCountRef.current % spawnRate === 0) {
      spawnEnemy(canvas);
    }

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter(b => {
      b.y -= b.speed;
      return b.y + b.height > 0;
    });

    // Update enemies
    enemiesRef.current = enemiesRef.current.filter(e => {
      e.y += e.speed;
      
      // Collision with player
      if (
        e.x < playerRef.current.x + playerRef.current.width &&
        e.x + e.width > playerRef.current.x &&
        e.y < playerRef.current.y + playerRef.current.height &&
        e.y + e.height > playerRef.current.y
      ) {
        onGameOver(scoreRef.current);
        return false;
      }

      // Check if passed bottom
      if (e.y > canvas.height) {
        onGameOver(scoreRef.current);
        return false;
      }

      return true;
    });

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.opacity = p.life;
      return p.life > 0;
    });

    // Bullet-Enemy collision
    bulletsRef.current.forEach((b, bIdx) => {
      enemiesRef.current.forEach((e, eIdx) => {
        if (
          b.x < e.x + e.width &&
          b.x + b.width > e.x &&
          b.y < e.y + e.height &&
          b.y + b.height > e.y
        ) {
          if (b.type === 'grenade') {
            // Grenade explosion
            createExplosion(b.x + b.width / 2, b.y + b.height / 2, '#ff4400', 30);
            const radius = b.radius || 100;
            
            // Damage nearby enemies
            enemiesRef.current.forEach((enemy, idx) => {
              const dx = (enemy.x + enemy.width / 2) - (b.x + b.width / 2);
              const dy = (enemy.y + enemy.height / 2) - (b.y + b.height / 2);
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist < radius) {
                enemy.hp -= b.damage;
                if (enemy.hp <= 0) {
                  // This will be handled in the next frame or we can handle it here
                  // For simplicity, let's just mark it for removal
                }
              }
            });
            bulletsRef.current.splice(bIdx, 1);
          } else {
            e.hp -= b.damage;
            bulletsRef.current.splice(bIdx, 1);
          }

          // Check for enemy death (common for all weapons)
          if (e.hp <= 0) {
            createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
            enemiesRef.current.splice(eIdx, 1);
            const points = (e.type === 'tank' ? 100 : (e.type === 'fast' ? 50 : 20));
            scoreRef.current += points;
            setScore(scoreRef.current);
            
            // Charge ultimate
            if (ultimateChargeRef.current < 100) {
              ultimateChargeRef.current = Math.min(100, ultimateChargeRef.current + 5);
              setUltimateCharge(ultimateChargeRef.current);
            }
          }
        }
      });
    });

    // Handle enemies marked for death by grenade (cleanup)
    enemiesRef.current = enemiesRef.current.filter(e => {
      if (e.hp <= 0) {
        createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
        const points = (e.type === 'tank' ? 100 : (e.type === 'fast' ? 50 : 20));
        scoreRef.current += points;
        setScore(scoreRef.current);
        
        if (ultimateChargeRef.current < 100) {
          ultimateChargeRef.current = Math.min(100, ultimateChargeRef.current + 5);
          setUltimateCharge(ultimateChargeRef.current);
        }
        return false;
      }
      return true;
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i + frameCountRef.current * 0.01) * canvas.width + canvas.width) % canvas.width;
      const y = (i * 20 + frameCountRef.current * 0.5) % canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    // Draw player
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00d4ff';
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.moveTo(playerRef.current.x + playerRef.current.width / 2, playerRef.current.y);
    ctx.lineTo(playerRef.current.x, playerRef.current.y + playerRef.current.height);
    ctx.lineTo(playerRef.current.x + playerRef.current.width, playerRef.current.y + playerRef.current.height);
    ctx.closePath();
    ctx.fill();

    // Draw bullets
    bulletsRef.current.forEach(b => {
      ctx.shadowBlur = 10;
      if (b.type === 'pistol') {
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.fillRect(b.x, b.y, b.width, b.height);
      } else if (b.type === 'smg') {
        ctx.shadowColor = '#00ffcc';
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(b.x, b.y, b.width, b.height);
      } else if (b.type === 'grenade') {
        ctx.shadowColor = '#ff4400';
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'minigun') {
        ctx.shadowColor = '#ffcc00';
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(b.x, b.y, b.width, b.height);
      }
    });

    // Draw enemies
    enemiesRef.current.forEach(e => {
      ctx.shadowColor = e.color;
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      
      if (e.type === 'tank') {
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(e.x + 5, e.y + e.height - 10, (e.width - 10) * (e.hp / e.maxHp), 5);
      }
    });

    // Draw particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    ctx.globalAlpha = 1;

    // Draw ultimate flash
    if (ultimateFlashRef.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${ultimateFlashRef.current * 0.5})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw ultimate active effect
    if (isUltimateActiveRef.current) {
      const hue = (frameCountRef.current * 5) % 360;
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
      ctx.lineWidth = 20;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.05)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.shadowBlur = 0;
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initGame();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseDown = () => {
      const now = Date.now();
      const weapon = currentWeaponRef.current;
      
      let cooldown = 150;
      if (weapon === 'smg') cooldown = 60;
      if (weapon === 'grenade') cooldown = 800;
      if (weapon === 'minigun') cooldown = 30;

      if (now - lastShotTimeRef.current > cooldown) {
        if (weapon === 'pistol') {
          bulletsRef.current.push({
            x: playerRef.current.x + playerRef.current.width / 2 - 5,
            y: playerRef.current.y,
            width: 10,
            height: 25,
            speed: 15,
            color: '#fff',
            type: 'pistol',
            damage: 1.5
          });
        } else if (weapon === 'smg') {
          bulletsRef.current.push({
            x: playerRef.current.x + playerRef.current.width / 2 - 2 + (Math.random() - 0.5) * 4,
            y: playerRef.current.y,
            width: 4,
            height: 12,
            speed: 18,
            color: '#00ffcc',
            type: 'smg',
            damage: 1.0
          });
        } else if (weapon === 'grenade') {
          bulletsRef.current.push({
            x: playerRef.current.x + playerRef.current.width / 2 - 6,
            y: playerRef.current.y,
            width: 12,
            height: 12,
            speed: 8,
            color: '#ff4400',
            type: 'grenade',
            damage: 5,
            radius: 150
          });
        } else if (weapon === 'minigun') {
          bulletsRef.current.push({
            x: playerRef.current.x + playerRef.current.width / 2 - 1.5 + (Math.random() - 0.5) * 8,
            y: playerRef.current.y,
            width: 3,
            height: 8,
            speed: 22,
            color: '#ffcc00',
            type: 'minigun',
            damage: 0.7
          });
        }
        lastShotTimeRef.current = now;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current[key] = true;

      if (key === 'q') {
        triggerUltimate();
      }
      if (key === '1') {
        currentWeaponRef.current = 'pistol';
        setCurrentWeapon('pistol');
      }
      if (key === '2') {
        currentWeaponRef.current = 'smg';
        setCurrentWeapon('smg');
      }
      if (key === '3') {
        currentWeaponRef.current = 'grenade';
        setCurrentWeapon('grenade');
      }
      if (key === '4') {
        currentWeaponRef.current = 'minigun';
        setCurrentWeapon('minigun');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current[key] = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPaused, difficulty, playerSpeed]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      <div className="absolute top-4 left-4 font-mono text-white text-2xl pointer-events-none flex flex-col gap-1">
        <div className="text-sm text-gray-500 flex items-center gap-1 uppercase tracking-widest">
          최고 기록: {highScore.toString().padStart(6, '0')}
        </div>
        <div>점수: {score.toString().padStart(6, '0')}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm">필살기 (Q):</span>
          {isUltimateActiveRef.current ? (
            <div className="flex items-center gap-2">
              <div className="text-[#00d4ff] font-bold animate-pulse">ACTIVE!</div>
              <div className="text-sm text-white/60">{ultimateTimeRemaining}s</div>
            </div>
          ) : (
            <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden border border-white/20">
              <div 
                className={`h-full transition-all duration-300 ${ultimateCharge === 100 ? 'bg-[#00d4ff] animate-pulse shadow-[0_0_10px_#00d4ff]' : 'bg-white/40'}`}
                style={{ width: `${ultimateCharge}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm">무기:</span>
          <div className="flex gap-1">
            {[
              { id: 'pistol', label: '1: 권총', color: 'bg-white' },
              { id: 'smg', label: '2: 기관단총', color: 'bg-[#00ffcc]' },
              { id: 'grenade', label: '3: 수류탄', color: 'bg-[#ff4400]' },
              { id: 'minigun', label: '4: 미니건', color: 'bg-[#ffcc00]' }
            ].map((w) => (
              <div 
                key={w.id}
                className={`px-2 py-1 text-[10px] rounded border transition-all ${
                  currentWeapon === w.id 
                    ? `${w.color} text-black font-bold border-transparent shadow-[0_0_10px_rgba(255,255,255,0.3)]` 
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}
              >
                {w.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
