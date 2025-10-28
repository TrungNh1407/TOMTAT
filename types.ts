import type { GroundingChunk } from "@google/genai";

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export type OutputFormat = 'markdown' | 'structured';

export interface Session {
  id: string;
  userId: string;
  title: string;
  summary: Message | null;
  messages: Message[];
  sources: GroundingChunk[];
  timestamp: number;
  fileName: string | null;
  inputType: InputType;
  url: string;
  youtubeVideoId: string | null;
  transcript: string | null;
  outputFormat: OutputFormat;
  suggestedQuestions?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  originalDocumentToc?: string | null;
  originalContent?: string | null;
  originalContentUrl?: string | null;
  isShared?: boolean;
}

export type SummaryLength = 'short' | 'medium' | 'long';
export type InputType = 'file' | 'web' | 'youtube';
export type Theme = 'light' | 'dark' | 'contrast';
export type MobileView = 'source' | 'result' | 'chat';

export interface Settings {
  fontSize: 'sm' | 'base' | 'lg';
  accentColor: 'blue' | 'green' | 'purple' | 'orange';
}
