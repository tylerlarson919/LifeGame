import { SVGProps } from "react";
import { RangeValue } from "@react-types/shared";
import { DateValue } from "@react-types/calendar";
import { CalendarDate } from "@internationalized/date";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Stage {
  id: string;
  title: string;
  description: string;
  dateRange: RangeValue<DateValue> | null; 
  difficulty: number;
  exp: number;
  hearts: number;
  gems: number;
  completed: boolean;
  emoji: string;

}

export interface Quest {
  id: string;
  stageId: string;
  stageName: string;
  title: string;
  description: string;
  difficulty: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  hearts: number;
  exp: number;
  gems: number;
  completed: boolean;
  emoji: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  exp: number;
  hearts: number;
  days: string[]; // e.g., ['M', 'T', 'W']
  completed: boolean;
}

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  exp: number;
  hearts: number;
  gems: number;
}