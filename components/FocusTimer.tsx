import { Button } from '@heroui/button';
import { Card } from '@heroui/card';
import { Input } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { useState } from 'react';

const FocusTimer = () => {
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startStopwatch = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      setInterval(() => setTime((prev) => prev + 1), 1000);
    }
  };

  return (
    <Card className="p-4">
      <Tabs>
        <Tab key="stopwatch" title="Stopwatch">
          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p>{time} seconds</p>
          <Button variant="bordered" onPress={startStopwatch}>{isRunning ? 'Stop' : 'Start'} </Button>
        </Tab>
        <Tab key="timer" title="Timer">
          <p>Timer placeholder</p>
        </Tab>
      </Tabs>
    </Card>
  );
};

export default FocusTimer;