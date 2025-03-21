import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import AddItemPopup from './AddItemPopup';
import { auth } from '../firebase';
import { Quest } from '../types';

const Quests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchQuests = async () => {
      if (auth.currentUser) {
        const querySnapshot = await getDocs(
          collection(db, `users/${auth.currentUser.uid}/quests`)
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Quest[];
        setQuests(data);
      }
    };
    fetchQuests();
  }, []);

  const addQuest = async (data: Omit<Quest, 'id' | 'completed'>) => {
    if (auth.currentUser) {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/quests`), {
        ...data,
        completed: false,
      });
      setIsOpen(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center">
        <h2>Quests</h2>
        <Button onPress={() => setIsOpen(true)}>+</Button>
      </div>
      {quests.map((q) => (
        <div key={q.id} className="mt-2">
          <p>{q.title}</p>
        </div>
      ))}
      <AddItemPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={addQuest}
        type="quest"
      />
    </Card>
  );
};

export default Quests;