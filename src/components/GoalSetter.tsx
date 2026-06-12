import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { calculateRequiredUpcomingSgpa } from "../utils/calc";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Info, Calculator } from "lucide-react";

export default function GoalSetter() {
  const [currentCgpa, setCurrentCgpa] = useState<number>(8.0);
  const [currentCredits, setCurrentCredits] = useState<number>(44);
  const [targetCgpa, setTargetCgpa] = useState<number>(8.5);
  const [upcomingCredits, setUpcomingCredits] = useState<number>(20);
  const [requiredSgpa, setRequiredSgpa] = useState<number | null>(null);

  useEffect(() => {
    const required = calculateRequiredUpcomingSgpa(
      targetCgpa,
      currentCgpa,
      currentCredits,
      upcomingCredits
    );
    setRequiredSgpa(required);
  }, [targetCgpa, currentCgpa, currentCredits, upcomingCredits]);

  // Determine difficulty / status message
  const getStatusDetails = (sgpa: number | null) => {
    if (sgpa === null) return { text: "Enter valid credits details", color: "text-slate-400", bg: "bg-slate-500/10", icon: Info };
    if (sgpa > 10.0) {
      return {
        text: "Mathematically Impossible (SGPA > 10.0)",
        description: "You'll need to lower your Target CGPA or increase upcoming semester credits to make this achievable.",
        color: "text-red-500",
        bg: "bg-red-500/10 border-red-500/20",
        badge: "Out of Reach",
        badgeBg: "bg-red-500/20 text-red-600 dark:text-red-400",
        icon: AlertTriangle,
      };
    }
    if (sgpa >= 9.0) {
      return {
        text: "Requires Outstanding Effort (S Grade Territory)",
        description: "You need to score nearly 90%+ in all upcoming courses. Highly demanding but achievable with perfect planning!",
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20",
        badge: "Critical Focus",
        badgeBg: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
        icon: AlertTriangle,
      };
    }
    if (sgpa >= 7.5) {
      return {
        text: "Moderate Focus Required",
        description: "A very standard and typical engineering semester. Steady performance will easily land you here.",
        color: "text-blue-500",
        bg: "bg-blue-500/10 border-blue-500/20",
        badge: "Moderate",
        badgeBg: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
        icon: CheckCircle,
      };
    }
    if (sgpa <= 4.0) {
      return {
        text: "Extremely Comfortable",
        description: "Your target is highly secure. Simply passing all your subjects (SGPA >= 4.0) will maintain or exceed your goals.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        badge: "Highly Attainable",
        badgeBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        icon: CheckCircle,
      };
    }
    return {
      text: "Fully Realistic & Manageable",
      description: "Requires consistent assignments and normal semester prep. You're on track to secure this!",
      color: "text-emerald-400",
      bg: "bg-emerald-500/5 border-emerald-500/15",
      badge: "Comfortable",
      badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle,
    };
  };

  const status = getStatusDetails(requiredSgpa);
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="backdrop-blur-xl bg-white/30 dark:bg-slate-900/40 p-6 md:p-8 rounded-3xl border border-white/20 dark:border-slate-800/20 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            "What-If" Academic Goal Setter
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Project requirements for your upcoming semesters based on target CGPA values
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Current CGPA */}
        <div className="bg-white/40 dark:bg-slate-900/30 p-4 rounded-2xl border border-white/10 dark:border-slate-800/10">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Current CGPA
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="10"
            value={currentCgpa}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCurrentCgpa(parseFloat(e.target.value) || 0)}
            className="w-full bg-transparent text-xl font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {/* Completed Credits */}
        <div className="bg-white/40 dark:bg-slate-900/30 p-4 rounded-2xl border border-white/10 dark:border-slate-800/10">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Completed Credits
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={currentCredits}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCurrentCredits(parseInt(e.target.value) || 0)}
            className="w-full bg-transparent text-xl font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {/* Target CGPA */}
        <div className="bg-white/40 dark:bg-slate-900/30 p-4 rounded-2xl border border-teal-500/30 dark:border-teal-500/20 ring-1 ring-teal-500/20">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1 flex items-center gap-1">
            Target CGPA <TrendingUp className="w-3 h-3 animate-bounce" />
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="10"
            value={targetCgpa}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 0)}
            className="w-full bg-transparent text-xl font-bold font-mono text-teal-600 dark:text-teal-400 focus:outline-none"
          />
        </div>

        {/* Next Sem Credits */}
        <div className="bg-white/40 dark:bg-slate-900/30 p-4 rounded-2xl border border-white/10 dark:border-slate-800/10">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Upcoming Sem Credits
          </label>
          <input
            type="number"
            step="1"
            min="1"
            value={upcomingCredits}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setUpcomingCredits(parseInt(e.target.value) || 1)}
            className="w-full bg-transparent text-xl font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Required Result Panel */}
      <motion.div
        layout
        className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
          requiredSgpa && requiredSgpa > 10.0
            ? "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200"
            : requiredSgpa && requiredSgpa >= 9.0
            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
            : "bg-teal-500/5 border-teal-500/20 text-slate-800 dark:text-teal-100"
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.badgeBg || "bg-teal-500/10"}`}>
              {status.badge || "Status Tag"}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">Formula Verified</span>
          </div>

          <h4 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 text-sm md:text-base">
            <StatusIcon className="w-5 h-5 flex-shrink-0" />
            {status.text}
          </h4>
          {status.description && (
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xl">
              {status.description}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 text-left md:text-right bg-white/20 dark:bg-slate-900/30 py-3.5 px-6 rounded-2xl border border-white/10 dark:border-slate-800/15">
          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center md:justify-end gap-1 font-semibold mb-1">
            <Calculator className="w-3.5 h-3.5 text-purple-400" /> REQUIRED SGPA
          </div>
          <div className="text-3xl md:text-4xl font-extrabold font-mono tracking-tight">
            {requiredSgpa !== null ? (
              <span className={requiredSgpa > 10.0 ? "text-red-500" : requiredSgpa >= 9.0 ? "text-amber-500" : "text-teal-500 dark:text-teal-400"}>
                {requiredSgpa < 0 ? "0.00" : requiredSgpa.toFixed(2)}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">--</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
            Based on {currentCredits + upcomingCredits} cumulative credits
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
