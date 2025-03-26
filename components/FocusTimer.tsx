import React from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownTrigger, DropdownSection, DropdownMenu } from '@heroui/dropdown';
import { Chip } from '@heroui/chip';
import { db, auth } from '../firebase';
import { getDocs, collection } from 'firebase/firestore';
import { Quest } from '../types';
import { useEffect } from 'react';
import TagSelect from './TagSelect';

const userTags: { key: string; label: string }[] = [
  { key: "personal", label: "Personal" },
  { key: "work", label: "Work" },
  { key: "side_hustles", label: "Side Hustles" },
];

const FocusTimer = () => {
  const [tag, setTag] = React.useState<string | null>(null);
  const [note, setNote] = useState('');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questLink, setQuestLink] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);

  const startStopwatch = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      setInterval(() => setTime((prev) => prev + 1), 1000);
    }
  };

    const fetchQuests = async () => {
      if (auth.currentUser) {
        const querySnapshot = await getDocs(
          collection(db, `users/${auth.currentUser.uid}/quests`)
        );
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Quest[];
        setQuests(data);
      }
    };
  
    useEffect(() => {
      fetchQuests();
    }, []);

  return (
      <Tabs className='w-full'>
        <Tab key="stopwatch" title="Stopwatch">
          <div className='flex flex-col gap-4 w-full'>
            <div className='flex gap-4 w-full'>
              <TagSelect
                className="w-1/2"
                id="tag"
                placeholder="New tag"
                selectedKeys={tag ? new Set([tag]) : new Set()}
                onSelectionChange={(keys) => setTag(Array.from(keys)[0] as string)}
                tags={userTags}
              />
              <div className='w-1/2'>
                  <Dropdown>
                    <DropdownTrigger id="quest-link-btn">
                      <Chip variant="dot" color="secondary" className='cursor-pointer'>
                        {questLink ? quests.find(s => s.id === selectedQuest)?.title || "Select Quest" : "No Quest"}
                      </Chip>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-labelledby="quest-link-btn" 
                      selectionMode="single"
                      selectedKeys={selectedQuest ? new Set([selectedQuest]) : new Set()}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSelectedQuest(selected);
                        setQuestLink(selected !== "none");
                      }}
                    >
                      <DropdownSection>
                        <DropdownItem key="none">None</DropdownItem>
                      </DropdownSection>
                      <DropdownSection>
                        {quests.filter(s => !s.completed).map((s) => (
                          <DropdownItem key={s.id}>{s.title}</DropdownItem>
                        ))}
                      </DropdownSection>
                    </DropdownMenu>
                  </Dropdown>
              </div>
            </div>
            <Input
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p>{time} seconds</p>
            <Button variant="bordered" onPress={startStopwatch}>{isRunning ? 'Stop' : 'Start'} </Button>
          </div>
        </Tab>
        <Tab key="timer" title="Timer">
          <p>Timer placeholder</p>
        </Tab>
      </Tabs>
  );
};

export default FocusTimer;