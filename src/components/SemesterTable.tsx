import { useState, useEffect } from "react";
import { Subject, Semester } from "../types";
import { calculateSubjectGrade, calculateSemesterSgpa } from "../utils/calc";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Save,
  BookOpen,
  Check,
  ChevronDown,
  Info,
  Layers,
  Sparkles,
  Calculator,
} from "lucide-react";

interface SemesterTableProps {
  key?: string | number;
  semester: Semester;
  onUpdate: (updatedSemester: Semester) => void | Promise<void>;
  onDelete: (semId: string) => void | Promise<void>;
  syncing: boolean;
}

export default function SemesterTable({
  semester,
  onUpdate,
  onDelete,
  syncing,
}: SemesterTableProps) {
  const [subjects, setSubjects] = useState<Subject[]>(semester.subjects || []);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setSubjects(semester.subjects || []);
  }, [semester.subjects]);

  const addSubject = () => {
    const newSub: Subject = {
      id: "sub_" + Math.random().toString(36).substr(2, 9),
      subjectName: "",
      credits: 3,
      cce: 40,
      ese: 40,
      tw: 20,
      maxCce: 50,
      maxEse: 50,
      maxTw: 25,
      hasEse: true,
      hasTw: false,
      gradePoints: 9,
      totalMarks: 80,
      gradeSymbol: "A",
    };

    const updatedList = [...subjects, newSub];
    recalculateAndUpdate(updatedList);
  };

  const deleteSubject = (subId: string) => {
    const updatedList = subjects.filter((s) => s.id !== subId);
    recalculateAndUpdate(updatedList);
  };

  const updateSubjectField = (subId: string, field: keyof Subject, value: any) => {
    const updatedList = subjects.map((sub) => {
      if (sub.id !== subId) return sub;

      const updatedSub = { ...sub, [field]: value };

      // Ensure boundary limits on marks
      if (field === "cce") updatedSub.cce = Math.min(updatedSub.maxCce, Math.max(0, Number(value) || 0));
      if (field === "ese") updatedSub.ese = Math.min(updatedSub.maxEse, Math.max(0, Number(value) || 0));
      if (field === "tw") updatedSub.tw = Math.min(updatedSub.maxTw, Math.max(0, Number(value) || 0));
      if (field === "credits") updatedSub.credits = Math.max(0, Number(value) || 0);

      // Re-trigger grade math on numeric or configuration shifts
      const calculations = calculateSubjectGrade(updatedSub);
      updatedSub.totalMarks = calculations.totalMarks;
      updatedSub.gradePoints = calculations.gradePoints;
      updatedSub.gradeSymbol = calculations.gradeSymbol;

      return updatedSub;
    });

    recalculateAndUpdate(updatedList);
  };

  const toggleSubjectType = (subId: string, type: "theory" | "practical" | "both") => {
    const updatedList = subjects.map((sub) => {
      if (sub.id !== subId) return sub;

      let hasEse = true;
      let hasTw = false;
      let maxTw = 25;

      if (type === "practical") {
        hasEse = false;
        hasTw = true;
        maxTw = 50; // default practical only is usually out of 50
      } else if (type === "theory") {
        hasEse = true;
        hasTw = false;
      } else if (type === "both") {
        hasEse = true;
        hasTw = true;
        maxTw = 25;
      }

      const updatedSub = {
        ...sub,
        hasEse,
        hasTw,
        maxTw,
      };

      const calculations = calculateSubjectGrade(updatedSub);
      updatedSub.totalMarks = calculations.totalMarks;
      updatedSub.gradePoints = calculations.gradePoints;
      updatedSub.gradeSymbol = calculations.gradeSymbol;

      return updatedSub;
    });

    recalculateAndUpdate(updatedList);
  };

  const recalculateAndUpdate = (updatedSubjects: Subject[]) => {
    setSubjects(updatedSubjects);
    const { sgpa, totalCredits } = calculateSemesterSgpa(updatedSubjects);

    onUpdate({
      ...semester,
      subjects: updatedSubjects,
      sgpa,
      totalCredits,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="backdrop-blur-xl bg-white/20 dark:bg-slate-900/40 p-6 rounded-3xl border border-white/20 dark:border-slate-800/20 shadow-xl"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Semester {semester.semesterNumber} Records
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Autonomous curriculum evaluation and credit weight mapping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/5">
            {syncing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full"
                />
                Syncing
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Cloud Synced
              </>
            )}
          </span>

          {showDeleteConfirm ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 bg-rose-500/10 dark:bg-rose-505/5 border border-rose-500/20 px-2.5 py-1.5 rounded-xl font-sans"
            >
              <span className="text-[11px] font-bold text-rose-500 dark:text-rose-450 mr-1 select-none">
                Delete Semester?
              </span>
              <button
                onClick={() => {
                  onDelete(semester.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] rounded-lg transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-extrabold text-[10px] rounded-lg transition-all"
              >
                No
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
              title="Delete Semester"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="overflow-x-auto mt-4 pr-1">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200/10 text-left">
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[240px]">
                Subject details
              </th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[70px] text-center">
                Credits
              </th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[140px] text-center">
                Evaluation Type
              </th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[210px] text-center">
                Component Marks
              </th>
              <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[110px] text-right">
                Results
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {subjects.map((sub, idx) => (
                <motion.tr
                  key={sub.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-slate-200/5 group hover:bg-white/5 dark:hover:bg-slate-900/10 transition-all"
                >
                  {/* Subject Name Input */}
                  <td className="py-3.5 px-2 relative">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-mono">
                        {idx + 1}.
                      </span>
                      <div className="relative flex-1">
                        <BookOpen className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mechanical Design"
                          value={sub.subjectName}
                          onChange={(e) => updateSubjectField(sub.id, "subjectName", e.target.value)}
                          className="w-full pl-8.5 pr-3 py-2 bg-white/40 dark:bg-slate-900/30 border border-slate-300/20 dark:border-slate-800/20 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/25 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs font-semibold select-all"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Credits Selection */}
                  <td className="py-3.5 px-2 text-center">
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={sub.credits}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateSubjectField(sub.id, "credits", e.target.value)}
                      className="w-12 py-2 text-center bg-white/40 dark:bg-slate-900/30 border border-slate-300/20 dark:border-slate-800/20 rounded-xl text-slate-800 dark:text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-teal-500"
                    />
                  </td>

                  {/* Subject Type toggle */}
                  <td className="py-3 px-2 text-center">
                    <div className="inline-flex p-0.5 bg-slate-200/10 rounded-lg border border-slate-400/5">
                      <button
                        type="button"
                        onClick={() => toggleSubjectType(sub.id, "theory")}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          sub.hasEse && !sub.hasTw
                            ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                        title="Theory Only (CCE + ESE)"
                      >
                        Theory
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSubjectType(sub.id, "both")}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          sub.hasEse && sub.hasTw
                            ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                        title="Theory + Term Work (CCE + ESE + TW)"
                      >
                        Both
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSubjectType(sub.id, "practical")}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          !sub.hasEse && sub.hasTw
                            ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                        title="Practical / TW Only"
                      >
                        TW Only
                      </button>
                    </div>
                  </td>

                  {/* Component Marks inputs */}
                  <td className="py-3.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {sub.hasEse ? (
                        <>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
                              CCE (/50)
                            </span>
                            <input
                              type="number"
                              required
                              min="0"
                              max="50"
                              value={sub.cce}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateSubjectField(sub.id, "cce", e.target.value)}
                              className="w-12 py-1.5 text-center bg-white/40 dark:bg-slate-900/30 border border-slate-300/20 dark:border-slate-800/20 rounded-lg text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
                              ESE (/50)
                            </span>
                            <input
                              type="number"
                              required
                              min="0"
                              max="50"
                              value={sub.ese}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateSubjectField(sub.id, "ese", e.target.value)}
                              className="w-12 py-1.5 text-center bg-white/40 dark:bg-slate-900/30 border border-slate-300/20 dark:border-slate-800/20 rounded-lg text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold focus:outline-none"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="min-w-24 text-slate-400/30 dark:text-slate-700 font-mono text-[10px] text-center border border-dashed border-slate-500/10 px-2 py-3 rounded-lg">
                          Exempted CCE/ESE
                        </div>
                      )}

                      {sub.hasTw ? (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
                            TW (/{sub.maxTw})
                          </span>
                          <input
                            type="number"
                            required
                            min="0"
                            max={sub.maxTw}
                            value={sub.tw}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateSubjectField(sub.id, "tw", e.target.value)}
                            className="w-12 py-1.5 text-center bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 rounded-lg text-slate-800 dark:text-teal-300 font-mono text-xs font-bold focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
                            TW (Excl.)
                          </span>
                          <input
                            type="text"
                            value="-"
                            disabled
                            className="w-12 py-1.5 text-center bg-slate-300/10 border border-transparent rounded-lg text-slate-400 font-mono text-xs select-none disabled:opacity-50"
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Calculated Grade Points & Symbols */}
                  <td className="py-3.5 px-2 text-right">
                    <div className="flex items-center justify-end gap-3 pr-1.5">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                          {sub.totalMarks} Marks
                        </div>
                        <div className="text-[10px] text-slate-450 dark:text-slate-450 font-semibold uppercase">
                          GP: <span className="font-bold text-teal-600 dark:text-teal-400">{sub.gradePoints}</span>
                        </div>
                      </div>

                      <span
                        className={`h-7.5 w-7.5 rounded-xl flex items-center justify-center text-xs font-extrabold font-mono shadow-sm border ${
                          sub.gradeSymbol === "S"
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                            : sub.gradeSymbol === "A" || sub.gradeSymbol === "B"
                            ? "bg-teal-500/10 border-teal-500/35 text-teal-600 dark:text-teal-400"
                            : sub.gradeSymbol === "C" || sub.gradeSymbol === "D"
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                            : sub.gradeSymbol === "E"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 animate-pulse"
                        }`}
                      >
                        {sub.gradeSymbol}
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteSubject(sub.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-450 hover:text-red-500 hover:bg-slate-500/10 rounded-lg cursor-pointer"
                        title="Delete Course Line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {subjects.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <div className="text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center gap-2">
                    <Info className="w-6 h-6 text-slate-400/50" />
                    No course papers added yet to this semester. Click 'Add Subject' below.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Addition & SGPA presentation */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-slate-250/15 dark:bg-slate-900/30 border border-slate-300/10 dark:border-slate-800/10">
        <button
          onClick={addSubject}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Add Academic Subject
        </button>

        <div className="flex items-center gap-4.5 bg-white/30 dark:bg-slate-900/40 px-5 py-2.5 rounded-xl border border-white/10 dark:border-slate-800/10 self-end sm:self-center">
          <div className="text-right">
            <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
              Semester Total Credits
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
              {semester.totalCredits || 0} Credits
            </span>
          </div>

          <div className="h-8 w-[1px] bg-slate-300/20 dark:bg-slate-700/30" />

          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Calculator className="w-3 h-3 text-teal-500" /> SEMESTER SGPA
            </span>
            <span className="text-2xl font-black text-teal-500 dark:text-teal-400 tracking-tight font-mono">
              {(semester.sgpa || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
