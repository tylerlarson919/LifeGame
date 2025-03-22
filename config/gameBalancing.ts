/**
 * gameBalancing.ts
 *
 * Provides formulas to calculate rewards for daily quests, quests, and stages.
 *
 * Daily Quests:
 *   - Rewards when completed:
 *       • Hearts: difficulty × 1
 *       • EXP: difficulty × 5
 *   - Penalty when missed:
 *       • Hearts lost: difficulty × 1
 *
 * Quests / Stages:
 *   - Rewards when completed:
 *       • EXP: (difficulty²) × 10
 *       • Gems: difficulty × 5
 */

export interface DailyQuestRewards {
    hearts: number;
    exp: number;
  }
  
  export interface QuestRewards {
    exp: number;
    gems: number;
  }
  
  /**
   * Calculates rewards for a daily quest based on its difficulty.
   * @param difficulty - A number representing the quest's difficulty (e.g., 1–5)
   * @returns An object containing the number of hearts and EXP earned.
   */
  export function getDailyQuestRewards(difficulty: number): DailyQuestRewards {
    if (difficulty < 1) {
      throw new Error("Daily quest difficulty must be at least 1");
    }
    return {
      hearts: difficulty * 1,
      exp: difficulty * 5,
    };
  }
  
  /**
   * Calculates the penalty (hearts lost) for missing a daily quest.
   * @param difficulty - A number representing the quest's difficulty (e.g., 1–5)
   * @returns The number of hearts lost.
   */
  export function getDailyQuestPenalty(difficulty: number): number {
    if (difficulty < 1) {
      throw new Error("Daily quest difficulty must be at least 1");
    }
    return difficulty * 1;
  }
  
  /**
   * Calculates rewards for quests or stages based on their difficulty.
   * @param difficulty - A number representing the quest's difficulty (e.g., 1–10)
   * @returns An object containing the EXP and gems earned.
   */
  export function getQuestRewards(difficulty: number): QuestRewards {
    if (difficulty < 1) {
      throw new Error("Quest difficulty must be at least 1");
    }
    return {
      exp: Math.pow(difficulty, 2) * 10,
      gems: difficulty * 5,
    };
  }