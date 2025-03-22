import { auth } from '../firebase';
import { useEffect, useState } from 'react';

const calculateLevel = (experience: number): number => {
    return Math.floor(Math.sqrt(experience / 5)); // Divide experience by 5 for slower leveling
  };
  
  const calculateNextLevelExp = (level: number): number => {
    return Math.pow(level + 1, 2) * 5; // Multiply required XP by 5 for bigger gaps
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
  // Calculate progress percentage within the current level
  const progressPercent = ((experience - currentLevelBaseExp) / (nextLevelExp - currentLevelBaseExp)) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row justify-between w-full items-center">
        <h3 className="font-bold">{userName}</h3>
      </div>
      <div className="flex flex-col items-center">
        <p>Health: {health}</p>
        <p>Level: {level}</p>
        <p>Experience: {experience} / {nextLevelExp} (next level)</p>
        {/* LEVEL PROGRESS BAR */}
        <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
