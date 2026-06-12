export interface Subject {
  id: string;
  subjectName: string;
  credits: number;
  cce: number;              // Continuous Comprehensive Evaluation (out of maxCce)
  ese: number;              // End Semester Examination (out of maxEse)
  tw: number;               // Term Work Marks (out of maxTw)
  maxCce: number;           // Usually 50
  maxEse: number;           // Usually 50
  maxTw: number;            // Usually 25 or 50
  hasEse: boolean;          // Set to true if has final exam (Theory + Lab)
  hasTw: boolean;           // Set to true if has term work or lab component
  gradePoints: number;      // Calculated grade points 0-10
  totalMarks: number;       // Calculated aggregate / out of total possible
  gradeSymbol: string;      // S, A, B, C, D, E, F
}

export interface Semester {
  id: string;
  userId: string;
  semesterNumber: number;
  subjects: Subject[];
  sgpa: number;
  totalCredits: number;
  createdAt: any;           // Firestore Timestamp or IsoString
  updatedAt: any;           // Firestore Timestamp or IsoString
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  college: string;
  department: string;
  createdAt: any;
  updatedAt: any;
}

export interface GoalSetup {
  currentCgpa: number;
  currentCredits: number;
  targetCgpa: number;
  upcomingCredits: number;
}
