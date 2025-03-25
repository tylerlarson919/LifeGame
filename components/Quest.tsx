import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { addDocumentToCollection, deleteDocument, updateDocument } from '../firebase';
import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { Quest } from '../types';
import { DatePicker } from '@heroui/date-picker';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem } from '@heroui/dropdown';
import React from "react";
import {parseDate, getLocalTimeZone, CalendarDate} from "@internationalized/date";
import { Modal, ModalContent } from '@heroui/modal';
import { ScrollShadow } from '@heroui/scroll-shadow';
import { getQuestRewards } from '../config/gameBalancing';
import { NumberInput } from '@heroui/number-input';
import { parseDateTime, CalendarDateTime } from "@internationalized/date";
import { Chip } from '@heroui/chip';
const Quests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stages, setStages] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const formatDueDate = (utcDateString: string) => {
    const date = new Date(utcDateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const fetchStages = async () => {
    if (auth.currentUser) {
      const querySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/stages`));
      const stagesData = querySnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title, completed: doc.data().completed }));
      setStages(stagesData);
    }
  };
  
  useEffect(() => {
    fetchStages();
  }, []);

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


  const addQuest = async (data: Omit<Quest, 'id' | 'completed'> & { stageId: string }) => {
    if (auth.currentUser) {
      await addDocumentToCollection(auth.currentUser.uid, 'quests', {
        ...data,
        completed: false,
      });
      setIsOpen(false);
      await fetchQuests();
    }
  };

// Update the deleteStage function:
const deleteQuest = async (quest: Quest) => {
  if (auth.currentUser) {
    await deleteDocument(auth.currentUser.uid, `quests/${quest.id}`);
    await fetchQuests();
  }
};

const editQuest = async (quest: Quest) => {
  if (auth.currentUser) {
    await updateDocument(auth.currentUser.uid, `quests/${quest.id}`, {
      ...quest,
      completed: quest.completed,
    });
    setEditModalOpen(false);
    await fetchQuests();
  }
};

  type AddQuestFormProps = {
    onSubmit: (data: Omit<Quest, 'id' | 'completed'>) => void;
    stages: Array<{ id: string; title: string; completed: boolean }>;
  };

type EditQuestFormProps = {
  stage: Quest;
  onSubmit: (data: Omit<Quest, 'id' | 'completed'>) => void;
};

const AddQuestForm: React.FC<AddQuestFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hearts, setHearts] = useState(1);
  const [exp, setExp] = useState(1);
  const [gems, setGems] = useState(1);
  const now = new Date();
  const [dueDate, setDueDate] = React.useState<CalendarDateTime | null>(
    new CalendarDateTime(
      now.getFullYear(),
      now.getMonth() + 1, // getMonth() returns 0-11, CalendarDateTime expects 1-12
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )
  );
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedStageName, setSelectedStageName] = useState<string>('');
  const [difficulty, setDifficulty] = useState(1);


  useEffect(() => {
    if (selectedStage) {
      const stage = stages.find(s => s.id === selectedStage);
      setSelectedStageName(stage ? stage.title : '');
    } else {
      setSelectedStageName('');
    }
  }, [selectedStage, stages]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description && dueDate) {
      const dueDateUTC = dueDate.toDate(getLocalTimeZone()).toISOString();
      onSubmit({ title, description, dueDate: dueDateUTC, exp, hearts, gems, difficulty, stageId: selectedStage, stageName: selectedStageName });
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <Input 
          size="lg"
          placeholder="New quest" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          classNames={{
            inputWrapper: ["bg-transparent active:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent focus:bg-transparent"],
            input: ["!text-2xl font-bold"],
          }}
        />
        <Input label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <DatePicker
          granularity="minute"
          hideTimeZone
          label="Due Date"
          labelPlacement="inside"
          value={dueDate}
          onChange={setDueDate}
        />
        <div className="flex flex-row gap-4 w-full justify-center items-center">
          <div className='flex flex-col gap-1 w-1/2'>
            <p className='text-[12px] text-[#D4D4D8] pl-3'>Stage</p>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="bordered" className='w-full'>
                  {selectedStage ? stages.find(s => s.id === selectedStage)?.title || "Select Stage" : "No Stage"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Link to Stage (optional)" 
                selectionMode="single"
                selectedKeys={new Set(selectedStage ? [selectedStage] : ["no-stage"])}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  if (selectedKey === "no-stage") {
                    setSelectedStage('');
                  } else {
                    setSelectedStage(selectedKey);
                  }
                }}
              >
                <DropdownSection>
                  <DropdownItem key="no-stage">No Stage</DropdownItem>
                </DropdownSection>
                <DropdownSection>
                  {stages.filter(s => !s.completed).map((s) => (
                    <DropdownItem key={s.id}>{s.title}</DropdownItem>
                  ))}
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
          <NumberInput className="w-1/2" minValue={1} maxValue={10} label="Difficulty" labelPlacement="inside" value={difficulty} onValueChange={setDifficulty} />
        </div>
        <div className='w-full flex flex-row gap-4 justify-center'>
          <p>✨ {getQuestRewards(difficulty).exp}</p>
          <p>💎 {getQuestRewards(difficulty).gems}</p>
        </div>
        <Button type="submit">Add Quest</Button>
      </div>
    </form>
  );
};
const EditQuestForm: React.FC<EditQuestFormProps & { stages: Array<{ id: string; title: string; completed: boolean }> }> = ({ stage, onSubmit, stages }) => {
  const [title, setTitle] = useState(stage.title);
  const [description, setDescription] = useState(stage.description);
  const [hearts, setHearts] = useState(stage.hearts);
  const [exp, setExp] = useState(stage.exp);
  const [gems, setGems] = useState(stage.gems);
  const [dueDate, setDueDate] = useState<CalendarDateTime | null>(
    stage.dueDate
      ? (() => {
          const date = new Date(stage.dueDate);
          return new CalendarDateTime(
            date.getFullYear(),
            date.getMonth() + 1, // getMonth() returns 0-11, CalendarDateTime expects 1-12
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
          );
        })()
      : null
  );
  const [selectedStage, setSelectedStage] = useState<string>(stage.stageId || '');
  const [selectedStageName, setSelectedStageName] = useState<string>(stage.stageName || '');
  const [difficulty, setDifficulty] = useState(stage.difficulty);

  useEffect(() => {
    if (selectedStage) {
      const stage = stages.find(s => s.id === selectedStage);
      setSelectedStageName(stage ? stage.title : '');
    } else {
      setSelectedStageName('');
    }
  }, [selectedStage, stages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description && dueDate) {
      const dueDateUTC = dueDate.toDate(getLocalTimeZone()).toISOString();
      onSubmit({ title, description, dueDate: dueDateUTC, exp, hearts, gems, difficulty, stageId: selectedStage, stageName: selectedStageName });
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <Input 
          size="lg"
          placeholder="New quest" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          classNames={{
            inputWrapper: ["bg-transparent active:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent focus:bg-transparent"],
            input: ["!text-2xl font-bold"],
          }}
        />
        <Input label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <DatePicker
          granularity="minute"
          hideTimeZone
          label="Due Date"
          labelPlacement="inside"
          value={dueDate}
          onChange={setDueDate}
        />
        <div className="flex flex-row gap-4 w-full justify-center items-center">
          <div className='flex flex-col gap-1 w-1/2'>
            <p className='text-[12px] text-[#D4D4D8] pl-3'>Stage</p>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="bordered" className='w-full'>
                  {selectedStage ? stages.find(s => s.id === selectedStage)?.title || "Select Stage" : "No Stage"}
                </Button>
              </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Link to Stage (optional)" 
                  selectionMode="single"
                  selectedKeys={new Set(selectedStage ? [selectedStage] : ["no-stage"])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    if (selectedKey === "no-stage") {
                      setSelectedStage('');
                    } else {
                      setSelectedStage(selectedKey);
                    }
                  }}
                >
                  <DropdownSection>
                    <DropdownItem key="no-stage">No Stage</DropdownItem>
                  </DropdownSection>
                  <DropdownSection>
                    {stages.filter(s => !s.completed).map((s) => (
                      <DropdownItem key={s.id}>{s.title}</DropdownItem>
                    ))}
                  </DropdownSection>
                </DropdownMenu>
            </Dropdown>
          </div>
          <NumberInput className="w-1/2" minValue={1} maxValue={10} label="Difficulty" labelPlacement="inside" value={difficulty} onValueChange={setDifficulty} />
        </div>
        <div className='w-full flex flex-row gap-4 justify-center'>
          <p>✨ {getQuestRewards(difficulty).exp}</p>
          <p>💎 {getQuestRewards(difficulty).gems}</p>
        </div>
        <Button type="submit">Confirm</Button>
      </div>
    </form>
  );
};


 
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center">
          <h2>Quests</h2>
          <Button onPress={() => setIsOpen(true)}>+</Button>
        </div>
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          className="w-full flex flex-row flex-nowrap gap-4 h-full py-2"
        >
          {quests.map((quest) => (
            <div
              key={quest.id}
              className="relative group"
              onClick={() => { setSelectedQuest(quest); setEditModalOpen(true); }}
            >
              <Card className="cardStyle w-[250px] h-[150px] shrink-0 p-4 cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-1 items-center">
                    <span>🔥</span>
                    <h4 className="text-sm truncate">{quest.title}</h4>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span>{quest.gems}💎</span>
                    <span>{quest.exp}✨</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs mt-1">
                  <span className='text-[#D4D4D8]'>{formatDueDate(quest.dueDate)}</span>
                  <Chip variant="dot" color="secondary">{quest.stageName}</Chip>
                </div>
              </Card>
              {/* Trashcan Icon */}
              <div
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuest(quest);
                  setDeleteModalOpen(true);
                }}
              >
                <button>🗑️</button>
              </div>
            </div>
          ))}
        </ScrollShadow>

        {/* New Quest Modal */}
        <Modal placement="center" size="xl" isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalContent>
            <div className="flex flex-col gap-4 p-4">
              <AddQuestForm onSubmit={addQuest} stages={stages} />
            </div>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal placement="center" size="sm" isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <ModalContent>
            <div className="flex flex-col gap-4 p-4">
              <h3>Delete Quest</h3>
              <p>Are you sure you want to delete {selectedQuest?.title}?</p>
              <div className="flex justify-end gap-2">
                <Button onPress={() => setDeleteModalOpen(false)}>Cancel</Button>
                <Button onPress={() => { 
                  if(selectedQuest) deleteQuest(selectedQuest); 
                  setDeleteModalOpen(false);
                }}>Delete</Button>
              </div>
            </div>
          </ModalContent>
        </Modal>

        {/* Edit Quest Modal */}
        <Modal placement="center" size="xl" isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
          <ModalContent>
            <div className="flex flex-col gap-4 p-4">
              {selectedQuest && (
                <EditQuestForm 
                  stage={selectedQuest}
                  onSubmit={(data) => editQuest({ ...selectedQuest, ...data })}
                  stages={stages}
                />
              )}
            </div>
          </ModalContent>
        </Modal>
      </div>
    </Card>
  );
};

export default Quests;