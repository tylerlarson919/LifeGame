import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db, cacheChange } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { deleteDocument, tweakValueOnDocument } from '../firebase';
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
import { Checkbox } from '@heroui/checkbox';
import { triggerQuestForProfile } from './PlayerStats';
import { FaArrowRightToBracket } from "react-icons/fa6";
import EmojiPicker, { Emoji, EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';


const Quests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stages, setStages] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [selectedFilterValue, setSelectedFilterValue] = React.useState(new Set(["today"]));

  const selectedFilterKeys = React.useMemo(
    () => Array.from(selectedFilterValue)
      .join(", ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    [selectedFilterValue],
  );

    const filteredQuests = React.useMemo(() => {
        const filterKey = Array.from(selectedFilterValue)[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
    
        return quests.filter(quest => {
          const questDate = new Date(quest.dueDate);
          questDate.setHours(0, 0, 0, 0);
          if (filterKey === "today") {
            return questDate.getTime() === today.getTime() && !quest.completed;
          } else if (filterKey === "todays_context") {
            return questDate.getTime() === today.getTime();
          } else if (filterKey === "tomorrow") {
            return questDate.getTime() === tomorrow.getTime() && !quest.completed;
          }
          return true;
        });
      }, [quests, selectedFilterValue]);

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

  useEffect(() => {
    if (auth.currentUser) {
      const unsubscribeQuests = onSnapshot(
        collection(db, `users/${auth.currentUser.uid}/quests`),
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Quest[];
          setQuests(data);
        }
      );

      const unsubscribeStages = onSnapshot(
        collection(db, `users/${auth.currentUser.uid}/stages`),
        (snapshot) => {
          const stagesData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            title: doc.data().title, 
            completed: doc.data().completed 
          }));
          setStages(stagesData);
        }
      );

      return () => {
        unsubscribeQuests();
        unsubscribeStages();
      };
    }
  }, []);


  const addQuest = (data: Omit<Quest, 'id' | 'completed'> & { stageId: string }) => {
    if (auth.currentUser) {
      cacheChange(
        auth.currentUser.uid,
        'quests',
        {
          ...data,
          completed: false,
        }
      );
      setIsOpen(false);
    }
  };

// Update the deleteStage function:
const deleteQuest = async (quest: Quest) => {
  if (auth.currentUser) {
    await deleteDocument(auth.currentUser.uid, `quests/${quest.id}`);
  }
};

const editQuest = (quest: Quest) => {
  if (auth.currentUser) {
    cacheChange(
      auth.currentUser.uid,
      `quests/${quest.id}`,
      {
        ...quest,
        completed: quest.completed,
      }
    );
    setEditModalOpen(false);
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
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('1f525');

  const handleEmojiClick = (emojiObject: EmojiClickData, event: MouseEvent) => {
    setSelectedEmoji(emojiObject.unified);
    setEmojiPickerOpen(false);
  };

  useEffect(() => {
    const rewards = getQuestRewards(difficulty);
    setExp(rewards.exp);
    setGems(rewards.gems);
  }, [difficulty]);

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
      onSubmit({ title, description, dueDate: dueDateUTC, exp, hearts, gems, difficulty, stageId: selectedStage, emoji: selectedEmoji, stageName: selectedStageName });
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div className='flex flex-row gap-2 items-center'>
          <div className="relative inline-block">
            <div
              className="cursor-pointer text-2xl"
              onClick={() => setEmojiPickerOpen((prev) => !prev)}
            >
              <Emoji emojiStyle={EmojiStyle.APPLE} unified={selectedEmoji} size={25} />
            </div>
            {emojiPickerOpen && (
              <div className="absolute top-10 left-0 z-50 shadow-lg w-fit h-fit">
                <EmojiPicker emojiStyle={EmojiStyle.APPLE} theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <Input 
            id="edit-quest-title"
            name="title"
            size="lg"
            placeholder="New quest" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            classNames={{
              inputWrapper: ["bg-transparent active:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent focus:bg-transparent"],
              input: ["!text-2xl font-bold"],
            }}
          />
        </div>
        <Input id="quest-description" aria-labelledby="quest-description-label" name="description" label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <DatePicker
          id="edit-quest-due-date"
          aria-labelledby="edit-quest-due-date-label"
          name="dueDate"
          granularity="minute"
          hideTimeZone
          label="Due Date"
          labelPlacement="inside"
          value={dueDate}
          onChange={setDueDate}
        />
        <div className="flex flex-row gap-4 w-full justify-center items-center">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  id="stage-dropdown-btn"
                  size="lg" 
                  variant="flat" 
                  className='w-1/2 h-[56px]'
                >
                  {selectedStage ? stages.find(s => s.id === selectedStage)?.title || "Select Stage" : "No Stage"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-labelledby="stage-dropdown-btn" 
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
          <NumberInput id="difficulty-level" aria-labelledby="difficulty-label" className="w-1/2" minValue={1} maxValue={10} label="Difficulty" labelPlacement="inside" value={difficulty} onValueChange={setDifficulty} />
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
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>(stage.emoji || '1f525');

  const handleEmojiClick = (emojiObject: EmojiClickData, event: MouseEvent) => {
    setSelectedEmoji(emojiObject.unified);
    setEmojiPickerOpen(false);
  };

  useEffect(() => {
    const rewards = getQuestRewards(difficulty);
    setExp(rewards.exp);
    setGems(rewards.gems);
  }, [difficulty]);

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
      onSubmit({ title, description, dueDate: dueDateUTC, exp, hearts, gems, difficulty, emoji: selectedEmoji, stageId: selectedStage, stageName: selectedStageName });
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div className='flex flex-row gap-2 items-center'>
          <div className="relative inline-block">
            <div
              className="cursor-pointer text-2xl"
              onClick={() => setEmojiPickerOpen((prev) => !prev)}
            >
              <Emoji emojiStyle={EmojiStyle.APPLE} unified={selectedEmoji} size={25} />
            </div>
            {emojiPickerOpen && (
              <div className="absolute top-10 left-0 z-50 shadow-lg w-fit h-fit">
                <EmojiPicker emojiStyle={EmojiStyle.APPLE} theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <Input 
            id="edit-quest-title"
            name="title"
            size="lg"
            placeholder="New quest" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            classNames={{
              inputWrapper: ["bg-transparent active:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent focus:bg-transparent"],
              input: ["!text-2xl font-bold"],
            }}
          />
        </div>
        <Input id="quest-description" aria-labelledby="quest-description-label" name="description" label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <DatePicker
          id="edit-quest-due-date"
          aria-labelledby="edit-quest-due-date-label"
          name="dueDate"
          granularity="minute"
          hideTimeZone
          label="Due Date"
          labelPlacement="inside"
          value={dueDate}
          onChange={setDueDate}
        />
        <div className="flex flex-row gap-4 w-full justify-center items-center">
            <Dropdown>
              <DropdownTrigger >
                <Button 
                    id="edit-stage-dropdown-btn"
                    size="lg" 
                    variant="flat" 
                    className='w-1/2 h-[56px]'
                  >
                  {selectedStage ? stages.find(s => s.id === selectedStage)?.title || "Select Stage" : "No Stage"}
                </Button>
              </DropdownTrigger>
                <DropdownMenu 
                  aria-labelledby="edit-stage-dropdown-btn" 
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



const QuestItem = ({ quest }: { quest: Quest }) => {
  const [questCompleted, setQuestCompleted] = useState(quest.completed);
  const initialRender = React.useRef(true);

  React.useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    const updateQuest = async () => {
      if (auth.currentUser) {
        await tweakValueOnDocument(auth.currentUser.uid, `quests/${quest.id}`, 'completed', questCompleted);
        triggerQuestForProfile(questCompleted);
      }
    };
    updateQuest();
  }, [questCompleted]);

  return (
    <div
      key={quest.id}
      className="relative group"
      onClick={() => {
        setSelectedQuest(quest);
        setEditModalOpen(true);
      }}
    >
      <Card className="cardStyle w-full h-[80px] shrink-0 p-4 cursor-pointer">
        <div className="flex justify-start items-center">
          <div
            className="w-fit h-fit flex items-center"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Checkbox
              id="quest-completed"
              name="questCompleted"
              className='w-fit h-fit'
              isSelected={questCompleted}
              onValueChange={() => setQuestCompleted(!questCompleted)}
            />
          </div>
          <div className="flex gap-1 items-center">
            <Emoji emojiStyle={EmojiStyle.APPLE} unified={quest.emoji} size={25} />
            <h4 className="text-sm truncate">{quest.title}</h4>
          </div>
        </div>
        <div className="flex flex-row gap-2 text-xs items-center">
          <span className="text-[#D4D4D8]">{formatDueDate(quest.dueDate)}</span>
          {quest.stageName && (
            <Chip size="sm" variant="dot" color="secondary">
              {quest.stageName}
            </Chip>
          )}
        </div>
        <div className="flex gap-2 text-sm w-fit items-center absolute bottom-2 right-2">
            <span>{quest.gems}💎</span>
            <span>{quest.exp}✨</span>
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
  );
};

 
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center w-full">
            <Dropdown>
              <DropdownTrigger>
                <Button id="time-filter-dropdown" className='w-full justify-start border-none' variant="bordered"><h3 className='text-left'>{selectedFilterKeys}</h3></Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-labelledby="time-filter-dropdown" 
                disallowEmptySelection
                selectedKeys={selectedFilterValue}
                selectionMode="single"
                onSelectionChange={(keys) => setSelectedFilterValue(new Set(keys as Set<string>))}
                >
                <DropdownItem key="today">Today</DropdownItem>
                <DropdownItem key="todays_context">Today's Context</DropdownItem>
                <DropdownItem key="tomorrow">Tomorrow</DropdownItem>
                <DropdownItem
                  endContent={<FaArrowRightToBracket className=''/>}
                  key="all"
                >See All</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          <Button onPress={() => setIsOpen(true)}>+</Button>
        </div>
        <ScrollShadow
          className="w-full flex flex-col flex-nowrap gap-2 h-full py-2"
        >
          {filteredQuests.map((quest) => (
            <QuestItem key={quest.id} quest={quest} />
          ))}
        </ScrollShadow>

        {/* New Quest Modal */}
        <Modal classNames={{ base: "overflow-visable", }} placement="center" size="xl" isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalContent className="overflow-visible">
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
        <Modal classNames={{ base: "overflow-visable", }} placement="center" size="xl" isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
          <ModalContent className="overflow-visible">
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
