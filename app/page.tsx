"use client";
import { useEffect, useState } from 'react';
import { Card } from '@heroui/card';
import {Tabs, Tab} from "@heroui/tabs";
import Avatar from '../components/Avatar';
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
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="p-4">
        <Avatar />
      </Card>
      <FocusTimer />
      <Stages />
      <Card className="p-4">
        <Tabs>
          <Tab key="quests" title="Quests">
            <Quests />
          </Tab>
          <Tab key="dailyQuests" title="Daily Quests">
            <DailyQuests />
          </Tab>
        </Tabs>
      </Card>
      <Card className="p-4">
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
  );
}