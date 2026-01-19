
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  grades: Grade[];
}

export interface Grade {
  assessmentId: string;
  value: number; // 0 to 20
  coefficient: number;
}

export interface Assessment {
  id: string;
  title: string;
  date: string;
  coefficient: number;
  maxScore: number;
}

export interface ClassData {
  id: string;
  name: string;
  students: Student[];
  assessments: Assessment[];
}

export type ViewType = 'dashboard' | 'students' | 'grades' | 'ai-assistant';
