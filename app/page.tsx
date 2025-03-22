"use client";
import { useEffect, useState } from 'react';
import { Card } from '@heroui/card';
import {Tabs, Tab} from "@heroui/tabs";
import PlayerStats from '../components/PlayerStats';
import FocusTimer from '../components/FocusTimer';
import Stages from '../components/Stage';
import Quests from '../components/Quest';
import DailyQuests from '../components/DailyQuests';
import CalendarView from '../components/CalendarView';
import Login from '../components/Login';
import { auth } from '../firebase';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Login />
      </div>
    );
  }

  const events = [
    { title: 'Sample Quest', start: new Date(), end: new Date() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full">
        <Stages />
      </div>
      <div className="flex flex-row gap-4">
        <Card className="cardStyle p-4 w-1/3">
          <PlayerStats />
        </Card>
        <FocusTimer />
      </div>
      <div className="flex flex-row gap-4">
        <Card className="cardStyle p-4 w-2/3">
          <Tabs>
            <Tab key="quests" title="Quests">
              <Quests />
            </Tab>
            <Tab key="dailyQuests" title="Daily Quests">
              <DailyQuests />
            </Tab>
          </Tabs>
        </Card>
        <Card className="cardStyle p-4 w-1/3">
        <p>Daily view placeholder</p>
        </Card>
      </div>
      <div className="flex w-full">
        <Card className="cardStyle p-4">
          <Tabs>
            <Tab key="monthly" title="Monthly">
              <CalendarView events={events} />
            </Tab>
            <Tab key="weekly" title="Weekly">
              <CalendarView events={events} />
            </Tab>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}