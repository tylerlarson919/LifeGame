import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { db, cacheChange } from '../firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import AddItemPopup from './AddItemPopup';
import { auth } from '../firebase';
import { DailyQuest } from '../types';

const DailyQuests = () => {
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      const unsubscribe = onSnapshot(
        collection(db, `users/${auth.currentUser.uid}/dailyQuests`),
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as DailyQuest[];
          setDailyQuests(data);
        }
      );
      return () => unsubscribe();
    }
  }, []);

  const addDailyQuest = (data: Omit<DailyQuest, 'id' | 'completed'>) => {
    if (auth.currentUser) {
      cacheChange(
        auth.currentUser.uid,
        `dailyQuests`,
        { ...data, completed: false }
      );
      setIsOpen(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center">
        <h2>Daily Quests</h2>
        <Button onPress={() => setIsOpen(true)}>+</Button>
      </div>
      {dailyQuests.map((dq) => (
        <div key={dq.id} className="mt-2">
          <p>{dq.title} - Days: {dq.days.join(', ')}</p>
        </div>
      ))}
      <AddItemPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={addDailyQuest}
        type="dailyQuest"
      />
    </Card>
  );
};

export default DailyQuests;
