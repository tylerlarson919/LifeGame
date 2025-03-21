import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Stage {
  id: string;
  title: string;
  description: string;
  exp: number;
  hearts: number;
  gems: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  stageId: string;
  title: string;
  description: string;
  exp: number;
  gems: number;
  completed: boolean;
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