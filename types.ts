

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface Component {
  id: string;
  type: 'resistor' | 'voltage_source' | 'ground' | 'led';
  value: number; // Ohms or Volts
  x: number;
  y: number;
  rotation: number;
  label?: string;
}

export interface Connection {
  id: string;
  fromId: string;
  fromTerminal: 'A' | 'B' | 'pos' | 'neg' | 'gnd';
  toId: string;
  toTerminal: 'A' | 'B' | 'pos' | 'neg' | 'gnd';
}

export interface CircuitData {
  components: Component[];
  connections: Connection[];
}

export interface CorrectAnswerCriteria {
  expectedVoltageAt?: { nodeId: string; value: number };
  expectedCurrentThrough?: { componentId: string; value: number };
  minComponents?: number;
  // Fix: use the same union type as Component for required components to prevent type mismatches during validation
  requiredComponents?: Component['type'][];
  tolerance: number; // e.g., 0.05 for 5%
}

export interface Question {
  id: string;
  topicId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  correctCriteria: CorrectAnswerCriteria;
  order: number;
}

export interface Topic {
  id: string;
  name: string;
  questions: Question[];
  tutorialUrl?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  password?: string;
  progress: {
    [topicId: string]: number; // Last solved question index
  };
}

export interface AppState {
  currentUser: User | null;
  topics: Topic[];
}