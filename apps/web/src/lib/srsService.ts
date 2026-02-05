
import { dub5ai } from './dub5ai';

export interface SRSItem {
  id: string;
  userId: string;
  front: string;
  back: string;
  interval: number; // in days
  repetition: number;
  efactor: number;
  nextReview: string; // ISO string
  tags?: string[];
  subjectId?: string;
}

/**
 * SM-2 Algorithm Implementation
 * Based on the SuperMemo-2 algorithm for spaced repetition.
 */
export const calculateSM2 = (
  quality: number, // 0-5
  prevInterval: number,
  prevRepetition: number,
  prevEfactor: number
) => {
  let interval: number;
  let repetition: number;
  let efactor: number;

  if (quality >= 3) {
    if (prevRepetition === 0) {
      interval = 1;
    } else if (prevRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEfactor);
    }
    repetition = prevRepetition + 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  efactor = prevEfactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (efactor < 1.3) efactor = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    interval,
    repetition,
    efactor,
    nextReview: nextReview.toISOString(),
  };
};

export const srsService = {
  async generateFlashcardsFromText(text: string, count: number = 5): Promise<{ front: string, back: string }[]> {
    const prompt = `Generate ${count} high-quality flashcards (front and back) from the following text. 
    Focus on key concepts, definitions, and important facts.
    Return ONLY a JSON array of objects with "front" and "back" fields.
    
    Text: ${text.substring(0, 4000)}`;

    try {
      const response = await dub5ai.streamRequest(prompt, { task: 'flashcards' });
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      return [];
    }
  }
};
