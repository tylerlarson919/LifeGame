import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent } from '@heroui/modal';
import { addDocumentToCollection, deleteDocument, updateDocument } from '../firebase';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { Stage } from '../types';
import { ScrollShadow } from "@heroui/scroll-shadow";

const Stages = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    fetchStages();
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

  const addStage = async (data: Omit<Stage, 'id' | 'completed'>) => {
    if (auth.currentUser) {
      await addDocumentToCollection(auth.currentUser.uid, 'stages', {
        ...data,
        completed: false,
      });
      setIsOpen(false);
      await fetchStages();
    }
  };


// Update the deleteStage function:
const deleteStage = async (stage: Stage) => {
  if (auth.currentUser) {
    await deleteDocument(auth.currentUser.uid, `stages/${stage.id}`);
    await fetchStages();
  }
};

const editStage = async (stage: Stage) => {
  if (auth.currentUser) {
    await updateDocument(auth.currentUser.uid, `stages/${stage.id}`, {
      ...stage,
      completed: stage.completed,
    });
    setEditModalOpen(false);
    await fetchStages();
  }
};


  type AddStageFormProps = {
    onSubmit: (data: Omit<Stage, 'id' | 'completed'>) => void;
  };

  type EditStageFormProps = {
    stage: Stage;
    onSubmit: (data: Omit<Stage, 'id' | 'completed'>) => void;
  };

  const AddStageForm: React.FC<AddStageFormProps> = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hearts, setHearts] = useState(1);
    const [exp, setExp] = useState(1);
    const [gems, setGems] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (title && description) {
        onSubmit({ title, description, exp, hearts, gems });
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Input label="Title" labelPlacement="inside" placeholder="New stage" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit">Add Stage</Button>
        </div>
      </form>
    );
  };
  const EditStageForm: React.FC<EditStageFormProps> = ({ stage, onSubmit }) => {
    const [title, setTitle] = useState(stage.title);
    const [description, setDescription] = useState(stage.description);
    const [hearts, setHearts] = useState(stage.hearts);
    const [exp, setExp] = useState(stage.exp);
    const [gems, setGems] = useState(stage.gems);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (title && description) {
        onSubmit({ title, description, exp, hearts, gems });
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Input label="Title" labelPlacement="inside" placeholder="New stage" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Description" labelPlacement="inside" placeholder="Focusing on..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit">Confirm</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
        <h2>Stages</h2>
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
            <Card className="w-[250px] h-[100px] shrink-0 p-4 cursor-pointer">
              <div className="flex gap-1 w-full">
                <h4>🔥</h4>
                <h4 className="truncate">{stage.title}</h4>
              </div>
              <p className="truncate">{stage.description}</p>
            </Card>
            {/* Trashcan Icon */}
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStage(stage);
                setDeleteModalOpen(true);
              }}>
              <button>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </ScrollShadow>

      {/* New Stage Modal */}
      <Modal placement="center" size="xl" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent>
          <div className="flex flex-col gap-4 p-4">
            <h3>New Stage</h3>
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
      <Modal placement="center" size="xl" isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <ModalContent>
          <div className="flex flex-col gap-4 p-4">
            <h3>Edit Stage</h3>
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
