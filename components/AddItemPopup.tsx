import { Modal, ModalContent } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Checkbox } from '@heroui/checkbox';
import { useState } from 'react';
import { Stage, Quest, DailyQuest } from '../types';

type ItemType = 'stage' | 'quest' | 'dailyQuest';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  type: ItemType;
}

const AddItemPopup = ({ isOpen, onClose, onSubmit, type }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stageId, setStageId] = useState('');
  const [days, setDays] = useState<string[]>([]);

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const handleSubmit = () => {
    if (type === 'stage') {
      onSubmit({
        title,
        description,
        exp: 1,
        hearts: 1,
        gems: 1,
      });
    } else if (type === 'quest') {
      onSubmit({
        stageId,
        title,
        description,
        exp: 1,
        gems: 1,
      });
    } else if (type === 'dailyQuest') {
      onSubmit({
        title,
        description,
        exp: 1,
        hearts: 1,
        days,
      });
    }
    setTitle('');
    setDescription('');
    setStageId('');
    setDays([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <h2>Add New {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          className="mt-4"
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          className="mt-4"
        />
        {type === 'quest' && (
          <Input
            label="Stage ID"
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            fullWidth
            className="mt-4"
          />
        )}
        {type === 'dailyQuest' && (
          <div className="mt-4">
            <p>Select Days:</p>
            {daysOfWeek.map((day) => (
              <Checkbox
                key={day}
                isSelected={days.includes(day)}
                onChange={() =>
                  setDays((prev) =>
                    prev.includes(day)
                      ? prev.filter((d) => d !== day)
                      : [...prev, day]
                  )
                }
              >
                {day}
              </Checkbox>
            ))}
          </div>
        )}
        <Button onPress={handleSubmit} className="mt-4">
          Add
        </Button>
      </ModalContent>
    </Modal>
  );
};

export default AddItemPopup;