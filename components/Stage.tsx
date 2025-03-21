import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import AddItemPopup from './AddItemPopup';
import { auth } from '../firebase';
import { Stage } from '../types';

const Stages = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchStages = async () => {
      if (auth.currentUser) {
        const querySnapshot = await getDocs(
          collection(db, `users/${auth.currentUser.uid}/stages`)
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Stage[];
        setStages(data);
      }
    };
    fetchStages();
  }, []);

  const addStage = async (data: Omit<Stage, 'id' | 'completed'>) => {
    if (auth.currentUser) {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/stages`), {
        ...data,
        completed: false,
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 overflow-x-auto h-[400px]">
      <div className="flex justify-between items-center">
        <h2>Stages</h2>
        <Button onPress={() => setIsOpen(true)}>+</Button>
      </div>
      <div className="flex gap-4">
        {stages.map((stage) => (
          <Card key={stage.id} className="w-[300px] h-[200px] p-4 shadow-md">
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
          </Card>
        ))}
      </div>
      <AddItemPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={addStage}
        type="stage"
      />
    </div>
  );
};

export default Stages;