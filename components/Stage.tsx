import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent } from '@heroui/modal';
import { addDocumentToCollection, deleteDocument, updateDocument, db, fetchStages } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { Stage } from '../types';
import { ScrollShadow } from "@heroui/scroll-shadow";
import {NumberInput} from "@heroui/number-input";
import {DateRangePicker} from "@heroui/date-picker";
import { RangeValue } from "@react-types/shared";
import { DateValue } from "@react-types/calendar";
import { getQuestRewards } from '../config/gameBalancing';
import EmojiPicker, { Emoji, EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';

const Stages = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const scrollRef = useRef<HTMLElement>(null);


  useEffect(() => {
    const getStages = async () => {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const stagesData = await fetchStages(userId);
        setStages(stagesData);
      }
    };
    getStages();
  }, []);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0 && event.deltaX === 0) {
        event.preventDefault();
        if (scrollRef.current) {
          scrollRef.current.scrollLeft += event.deltaY * 0.5;
        }
      }
    };
    if (scrollRef.current) {
      scrollRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (scrollRef.current) {
        scrollRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const addStage = async (data: Omit<Stage, 'id' | 'completed'> & { dateRange: RangeValue<DateValue> | null }) => {
    if (auth.currentUser) {
      const serializedData = {
        ...data,
        dateRange: data.dateRange
          ? {
              start: data.dateRange.start.toString(),
              end: data.dateRange.end.toString(),
            }
          : null,
        completed: false,
      };
      await addDocumentToCollection(auth.currentUser.uid, 'stages', serializedData);
      setIsOpen(false);
      const stagesData = await fetchStages(auth.currentUser.uid);
      setStages(stagesData); // Update state with fetched data
    }
  };


// Update the deleteStage function:
const deleteStage = async (stage: Stage) => {
  if (auth.currentUser) {
    await deleteDocument(auth.currentUser.uid, `stages/${stage.id}`);
    const stagesData = await fetchStages(auth.currentUser.uid);
    setStages(stagesData); // Update state with fetched data
  }
};

const editStage = async (stage: Stage) => {
  if (auth.currentUser) {
    const serializedData = {
      ...stage,
      dateRange: stage.dateRange
        ? {
            start: stage.dateRange.start.toString(),
            end: stage.dateRange.end.toString(),
          }
        : null,
      completed: stage.completed,
    };
    await updateDocument(auth.currentUser.uid, `stages/${stage.id}`, serializedData);
    setEditModalOpen(false);
    const stagesData = await fetchStages(auth.currentUser.uid);
    setStages(stagesData); // Update state with fetched data
  }
};


  type AddStageFormProps = {
    onSubmit: (data: Omit<Stage, 'id' | 'completed'> & { dateRange: RangeValue<DateValue> | null }) => void;
  };

  type EditStageFormProps = {
    stage: Stage;
    onSubmit: (data: Omit<Stage, 'id' | 'completed'> & { dateRange: RangeValue<DateValue> | null }) => void;
  };

  const AddStageForm: React.FC<AddStageFormProps> = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>(null);
    const [difficulty, setDifficulty] = useState(1);
    const [hearts, setHearts] = useState(1);
    const [exp, setExp] = useState(1);
    const [gems, setGems] = useState(1);
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (title && description) {
        onSubmit({ title, description, dateRange, difficulty, emoji: selectedEmoji, exp, hearts, gems });
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
              size="lg"
              placeholder="New stage" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              classNames={{
                inputWrapper: ["bg-transparent active:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent focus:bg-transparent"],
                input: ["!text-2xl font-bold"],
              }}
            />
          </div>
          <Input label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <NumberInput minValue={1} maxValue={10} label="Difficulty" labelPlacement="inside" value={difficulty} onValueChange={setDifficulty} />
          <DateRangePicker label="Date range" labelPlacement="inside" value={dateRange} onChange={setDateRange} />
          <div className='w-full flex flex-row gap-4 justify-center'>
            <p>✨ {getQuestRewards(difficulty).exp}</p>
            <p>💎 {getQuestRewards(difficulty).gems}</p>
          </div>
          <Button type="submit">Add Stage</Button>
        </div>
      </form>
    );
  };
  const EditStageForm: React.FC<EditStageFormProps> = ({ stage, onSubmit }) => {
    const [title, setTitle] = useState(stage.title);
    const [description, setDescription] = useState(stage.description);
    const [dateRange, setDateRange] = useState(stage.dateRange);
    const [difficulty, setDifficulty] = useState(stage.difficulty);
    const [hearts, setHearts] = useState(stage.hearts);
    const [exp, setExp] = useState(stage.exp);
    const [gems, setGems] = useState(stage.gems);
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (title && description) {
        onSubmit({ title, description, dateRange, difficulty, emoji: selectedEmoji, exp, hearts, gems });
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
              size="lg"
              placeholder="New stage" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              classNames={{
                inputWrapper: ["bg-transparent active:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent focus:bg-transparent"],
                input: ["!text-2xl font-bold"],
              }}
            />
          </div>
          <Input label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <NumberInput minValue={1} maxValue={10} label="Difficulty" labelPlacement="inside" value={difficulty} onValueChange={setDifficulty} />
          <DateRangePicker label="Date range" labelPlacement="inside" value={dateRange} onChange={setDateRange} />
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
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
        <h3>Stages</h3>
        <Button onPress={() => setIsOpen(true)}>+</Button>
      </div>
      <ScrollShadow
        hideScrollBar
        ref={scrollRef}
        orientation="horizontal"
        className="w-full flex flex-row flex-nowrap gap-4 h-full py-2"
      >
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="relative group"
            onClick={() => { setSelectedStage(stage); setEditModalOpen(true); }}
          >
            <Card className="cardStyle w-[250px] h-[100px] shrink-0 p-4 cursor-pointer">
              <div className="flex justify-between items-center mb-1">
                <div className="flex gap-1 items-center">
                  <Emoji emojiStyle={EmojiStyle.APPLE} unified={stage.emoji} size={25} />
                  <h4 className="text-sm truncate">{stage.title}</h4>
                </div>
                <div className="flex gap-2 text-sm">
                  <span>{stage.gems}💎</span>
                  <span>{stage.exp}✨</span>
                </div>
              </div>
              <p className="text-sm line-clamp-2">{stage.description}</p>
            </Card>
            {/* Trashcan Icon */}
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStage(stage);
                setDeleteModalOpen(true);
              }}
            >
              <button>🗑️</button>
            </div>
          </div>
        ))}
      </ScrollShadow>

      {/* New Stage Modal */}
      <Modal classNames={{ base: "overflow-visable", }} placement="center" size="xl" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent className="overflow-visible">
          <div className="flex flex-col gap-4 p-4">
            <AddStageForm onSubmit={addStage} />
          </div>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal placement="center" size="sm" isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalContent>
          <div className="flex flex-col gap-4 p-4">
            <h3>Delete Stage</h3>
            <p>Are you sure you want to delete {selectedStage?.title}?</p>
            <div className="flex justify-end gap-2">
              <Button onPress={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button onPress={() => { 
                if(selectedStage) deleteStage(selectedStage); 
                setDeleteModalOpen(false);
              }}>Delete</Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Edit Stage Modal */}
      <Modal classNames={{ base: "overflow-visable", }} placement="center" size="xl" isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <ModalContent className="overflow-visible">
          <div className="flex flex-col gap-4 p-4">
            {selectedStage && (
              <EditStageForm 
                stage={selectedStage}
                onSubmit={(data) => editStage({ ...selectedStage, ...data })}
              />
            )}
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Stages;
