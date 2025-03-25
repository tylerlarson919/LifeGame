import { auth, db } from '../firebase';
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { parseDate } from "@internationalized/date";
import { Stage, Quest } from '../types';

const calculateLevel = (experience: number): number => {
  return Math.floor(Math.sqrt(experience / 5)); 
};

const calculateNextLevelExp = (level: number): number => {
  return Math.pow(level + 1, 2) * 5; 
};

const PlayerStats = () => {
  const xpBarRef = useRef<HTMLDivElement>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [experience, setExperience] = useState(0);
  const [health, setHealth] = useState(100);
  const [level, setLevel] = useState(0);
  const [nextLevelExp, setNextLevelExp] = useState(0);
  const [currentLevelBaseExp, setCurrentLevelBaseExp] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [displayedLevel, setDisplayedLevel] = useState(level);
  const [displayedXP, setDisplayedXP] = useState(experience);
  const [displayedProgress, setDisplayedProgress] = useState(progressPercent);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserName(user?.displayName || null);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (level !== displayedLevel) {
      const startValue = displayedLevel;
      const endValue = level;
      const duration = 1000;
      const easeInOut = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      let startTime: number | null = null;
      const animate = (timestamp: number) => {
        if (startTime === null) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOut(progress);
        const value = Math.round(
          startValue + (endValue - startValue) * easedProgress
        );
        setDisplayedLevel(value);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [level]);

  useEffect(() => {
    const startXP = displayedXP;
    const endXP = experience;
    if (startXP === endXP) return;
    const duration = 1000;
    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    let startTime: number | null = null;
    const animateXP = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOut(progress);
      const newXP = Math.round(startXP + (endXP - startXP) * easedProgress);
      setDisplayedXP(newXP);
      if (progress < 1) requestAnimationFrame(animateXP);
    };
    requestAnimationFrame(animateXP);
  }, [experience]);


  
  

  const fetchStages = async () => {
    if (auth.currentUser) {
      const querySnapshot = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/stages`)
      );
      const data = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          dateRange: docData.dateRange
            ? {
                start: parseDate(docData.dateRange.start),
                end: parseDate(docData.dateRange.end),
              }
            : null,
        } as Stage;
      });
      data.sort((a, b) => {
        if (!a.dateRange || !b.dateRange) return a.dateRange ? 1 : -1;
        return a.dateRange.end.compare(b.dateRange.end);
      });
      setStages(data);
    }
  };

  const fetchQuests = async () => {
    if (auth.currentUser) {
      const querySnapshot = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/quests`)
      );
      const data = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
        } as Quest;
      });
      data.sort((a, b) => {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      setQuests(data);
    }
  };
  

  // 1. Fetch stages and quests on mount.
  useEffect(() => {
    fetchStages();
    fetchQuests();
  }, []);


  useEffect(() => {
    const handleTrigger = (e: CustomEvent<{ completed: boolean }>) => {
      if (e.detail.completed) {
        fetchStages();
        fetchQuests();
        if (xpBarRef.current) {
          // Remove the class first to allow re-triggering
          xpBarRef.current.classList.remove("expand-wiggle");
          // Force reflow to restart the animation
          void xpBarRef.current.offsetWidth;
          xpBarRef.current.classList.add("expand-wiggle");
        }
      }
    };
  
    window.addEventListener('triggerQuestForProfile', handleTrigger as EventListener);
    return () => window.removeEventListener('triggerQuestForProfile', handleTrigger as EventListener);
  }, []);

  // 2. Recalculate experience when stages or quests change.
  // Here we assume that completed stages and quests contribute their exp.
  useEffect(() => {
    const stagesXP = stages
      .filter(stage => stage.completed)
      .reduce((acc, stage) => acc + stage.exp, 0);
    const questsXP = quests
      .filter(quest => quest.completed)
      .reduce((acc, quest) => acc + quest.exp, 0);
    setExperience(stagesXP + questsXP);
  }, [stages, quests]);

  // 3. Recalculate level details whenever experience changes.
  useEffect(() => {
    const newLevel = calculateLevel(experience);
    const newNextLevelExp = calculateNextLevelExp(newLevel);
    const newCurrentLevelBaseExp = Math.pow(newLevel, 2) * 5;
    const newProgressPercent = ((experience - newCurrentLevelBaseExp) / (newNextLevelExp - newCurrentLevelBaseExp)) * 100;

    setLevel(newLevel);
    setNextLevelExp(newNextLevelExp);
    setCurrentLevelBaseExp(newCurrentLevelBaseExp);
    setProgressPercent(newProgressPercent);
  }, [experience]);

  return (
    <div id="profile-container" className="flex flex-col items-center p-2 text-white w-full">
      {/* Username */}
      <h3 className="text-xl font-extrabold tracking-wide text-blue-400 drop-shadow-md">{userName || "Player"}</h3>

      {/* Health Bar */}
      <div className="w-full bg-gray-700 rounded-full h-6 mt-4 relative overflow-hidden">
        <div className="bg-red-500 h-6 rounded-full transition-all duration-300" style={{ width: `${health}%` }} />
        <span className="absolute w-full text-center text-xs font-bold top-1/2 -translate-y-1/2">{health} HP</span>
      </div>

      {/* Level & XP Info */}
      <div className="flex flex-col items-center mt-4">
        <p className="text-lg font-bold text-yellow-400">{displayedLevel}</p>
        <p className="text-sm text-gray-400">XP: {displayedXP} / {nextLevelExp}</p>
      </div>

      {/* XP Progress Bar */}
      <div ref={xpBarRef} className="w-full bg-gray-800 rounded-full h-4 mt-3 relative overflow-hidden">
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

export const triggerQuestForProfile = (completed: boolean) => {
  window.dispatchEvent(new CustomEvent('triggerQuestForProfile', { detail: { completed } }));
};