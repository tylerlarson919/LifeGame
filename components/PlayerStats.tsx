import { auth } from '../firebase';
import { useEffect, useState } from 'react';

const calculateLevel = (experience: number): number => {
  return Math.floor(Math.sqrt(experience / 5)); 
};

const calculateNextLevelExp = (level: number): number => {
  return Math.pow(level + 1, 2) * 5; 
};

const PlayerStats = () => {
  const [experience, setExperience] = useState(101);
  const [health, setHealth] = useState(100);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserName(user?.displayName || null);
    });
    return () => unsubscribe();
  }, []);

  const level = calculateLevel(experience);
  const nextLevelExp = calculateNextLevelExp(level);
  const currentLevelBaseExp = Math.pow(level, 2);
  const progressPercent = ((experience - currentLevelBaseExp) / (nextLevelExp - currentLevelBaseExp)) * 100;

  return (
    <div className="flex flex-col items-center p-2 text-white w-full">
      {/* Username */}
      <h3 className="text-xl font-extrabold tracking-wide text-blue-400 drop-shadow-md">{userName || "Player"}</h3>

      {/* Health Bar */}
      <div className="w-full bg-gray-700 rounded-full h-6 mt-4 relative overflow-hidden">
        <div className="bg-red-500 h-6 rounded-full transition-all duration-300" style={{ width: `${health}%` }} />
        <span className="absolute w-full text-center text-xs font-bold top-1/2 -translate-y-1/2">{health} HP</span>
      </div>

      {/* Level & XP Info */}
      <div className="flex flex-col items-center mt-4">
        <p className="text-lg font-bold text-yellow-400"> {level}</p>
        <p className="text-sm text-gray-400">XP: {experience} / {nextLevelExp}</p>
      </div>

      {/* XP Progress Bar */}
      <div className="w-full bg-gray-800 rounded-full h-4 mt-3 relative overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="absolute w-full text-center text-xs font-bold top-1/2 -translate-y-1/2">{Math.round(progressPercent)}%</span>
      </div>
    </div>
  );
};

export default PlayerStats;
