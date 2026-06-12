import { Subject, Semester } from "../types";

/**
 * Normalizes subject marks and returns Grade Point (0-10) and Grade Symbol (O, A+, A, etc.)
 * Scale:
 *   90-100 = 10
 *   80-89  = 9
 *   70-79  = 8
 *   60-69  = 7
 *   50-59  = 6
 *   40-49  = 5
 *   <40    = 0 (Fail)
 */
export function calculateSubjectGrade(sub: {
  cce: number;
  ese: number;
  tw: number;
  maxCce: number;
  maxEse: number;
  maxTw: number;
  hasEse: boolean;
  hasTw: boolean;
}) {
  const earnedCce = sub.hasEse ? Number(sub.cce) || 0 : 0;
  const earnedEse = sub.hasEse ? Number(sub.ese) || 0 : 0;
  const earnedTw = sub.hasTw ? Number(sub.tw) || 0 : 0;

  const totalPossible =
    (sub.hasEse ? (Number(sub.maxCce) || 50) + (Number(sub.maxEse) || 50) : 0) +
    (sub.hasTw ? Number(sub.maxTw) || 25 : 0);

  const totalEarned = earnedCce + earnedEse + earnedTw;

  if (totalPossible === 0) {
    return {
      totalMarks: 0,
      gradePoints: 0,
      gradeSymbol: "F",
      percentage: 0,
    };
  }

  // Percentage scaled to 100
  const percentage = Math.min(100, Math.max(0, (totalEarned / totalPossible) * 100));
  const roundedPercent = Math.round(percentage * 100) / 100; // Round to 2 decimal places

  let gradePoints = 0;
  let gradeSymbol = "F";

  const integerPercent = Math.floor(roundedPercent);

  if (integerPercent >= 90) {
    gradePoints = 10;
    gradeSymbol = "S"; // Outstanding / S Grade
  } else if (integerPercent >= 80) {
    gradePoints = 9;
    gradeSymbol = "A";
  } else if (integerPercent >= 70) {
    gradePoints = 8;
    gradeSymbol = "B";
  } else if (integerPercent >= 60) {
    gradePoints = 7;
    gradeSymbol = "C";
  } else if (integerPercent >= 50) {
    gradePoints = 6;
    gradeSymbol = "D";
  } else if (integerPercent >= 40) {
    gradePoints = 5;
    gradeSymbol = "E";
  } else {
    gradePoints = 0;
    gradeSymbol = "F";
  }

  return {
    totalMarks: totalEarned,
    gradePoints,
    gradeSymbol,
    percentage: roundedPercent,
  };
}

/**
 * Calculates semester-level SGPA
 * Formula: Sum of (Grade Points x Credits) / Total Credits
 */
export function calculateSemesterSgpa(subjects: Subject[]): {
  sgpa: number;
  totalCredits: number;
} {
  let totalWeightedGP = 0;
  let totalCredits = 0;

  subjects.forEach((sub) => {
    const credits = Number(sub.credits) || 0;
    totalWeightedGP += sub.gradePoints * credits;
    totalCredits += credits;
  });

  const sgpa = totalCredits > 0 ? totalWeightedGP / totalCredits : 0;
  // Round to nearest 2 decimal places
  const roundedSgpa = Math.round(sgpa * 100) / 100;

  return {
    sgpa: roundedSgpa,
    totalCredits,
  };
}

/**
 * Calculates cumulative CGPA across various semesters
 * Formula: Sum of (SGPA x Total Credits for that semester) / Cumulative Credits
 */
export function calculateCumulativeCgpa(semesters: Semester[]): {
  cgpa: number;
  cumulativeCredits: number;
} {
  let totalSgpaCredits = 0;
  let cumulativeCredits = 0;

  semesters.forEach((sem) => {
    const semCredits = Number(sem.totalCredits) || 0;
    const semSgpa = Number(sem.sgpa) || 0;
    totalSgpaCredits += semSgpa * semCredits;
    cumulativeCredits += semCredits;
  });

  const cgpa = cumulativeCredits > 0 ? totalSgpaCredits / cumulativeCredits : 0;
  return {
    cgpa: Math.round(cgpa * 100) / 100,
    cumulativeCredits,
  };
}

/**
 * Core What-If upcoming GPA requirement logic
 * Given target CGPA, current CGPA, current total credits, and upcoming semester credits:
 * Target CGPA = (Current CGPA * Current Credits + Upcoming SGPA * Upcoming Credits) / (Current Credits + Upcoming Credits)
 * Rearranged for Upcoming SGPA:
 * Upcoming SGPA = [Target CGPA * (Current Credits + Upcoming Credits) - Current CGPA * Current Credits] / Upcoming Credits
 */
export function calculateRequiredUpcomingSgpa(
  targetCgpa: number,
  currentCgpa: number,
  currentCredits: number,
  upcomingCredits: number
): number | null {
  if (upcomingCredits <= 0) return null;

  const totalCreditsAfterSem = currentCredits + upcomingCredits;
  const targetPoints = targetCgpa * totalCreditsAfterSem;
  const existingPoints = currentCgpa * currentCredits;

  const requiredUpcomingPoints = targetPoints - existingPoints;
  const requiredSgpa = requiredUpcomingPoints / upcomingCredits;

  return Math.round(requiredSgpa * 100) / 100;
}
