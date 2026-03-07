import { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingAccumulator = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ top: 20, left: 20 });
  const [visible, setVisible] = useState(true);

  const randomize = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setPosition({
        top: Math.random() * 70 + 10,
        left: Math.random() * 70 + 10,
      });
      setVisible(true);
    }, 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(randomize, 4000);
    randomize();
    return () => clearInterval(interval);
  }, [randomize]);

  return (
    <div
      className={`fixed z-50 pointer-events-auto transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
      <button
        onClick={() => navigate('/accumulator')}
        className="flex flex-col items-center gap-0.5 group"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-yellow-300/50 group-hover:scale-110 transition-transform animate-bounce">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <span className="text-[9px] font-bold text-foreground bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-border/50 shadow-sm">
          မောင်း
        </span>
      </button>
    </div>
  );
};

export default FloatingAccumulator;
