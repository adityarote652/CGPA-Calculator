import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { Semester, UserProfile } from "./types";
import { calculateCumulativeCgpa } from "./utils/calc";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Moon,
  LogOut,
  Plus,
  GraduationCap,
  Award,
  BookMarked,
  Layers,
  Sparkles,
  RefreshCw,
  School,
  BrainCircuit,
  MessageSquare,
} from "lucide-react";
import DynamicBackground from "./components/DynamicBackground";
import AuthPage from "./components/AuthPage";
import SemesterTable from "./components/SemesterTable";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});
  const [masterLoading, setMasterLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load theme and configure auth subscription
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    } else {
      setDarkMode(true); // Default to gorgeous dark cyber theme
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setMasterLoading(true);
      setDbError(null);
      setCurrentUser(user);

      if (user) {
        await loadUserData(user.uid);
      } else {
        setProfile(null);
        setSemesters([]);
      }
      setAuthCheckComplete(true);
      setMasterLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      setDbError(null);
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setProfile(userSnap.data() as UserProfile);

        // Fetch student's semester records
        const semRef = collection(db, "users", uid, "semesters");
        const q = query(semRef, orderBy("semesterNumber", "asc"));
        const semSnap = await getDocs(q);

        const loadedSems: Semester[] = [];
        semSnap.forEach((docSnap) => {
          loadedSems.push(docSnap.data() as Semester);
        });

        setSemesters(loadedSems);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error("Failed to load user information:", err);
      let errMsg = err.message || "Missing or insufficient permissions.";
      if (errMsg.includes("permission") || errMsg.includes("Permission")) {
        errMsg = "Missing or insufficient database permissions. If you just initialized your account, please try logging in again or refresh the page.";
      }
      setDbError(errMsg);
    }
  };

  const toggleDarkMode = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Add a brand-new blank Semester block to our schema
  const addNewSemester = async () => {
    if (!currentUser) return;

    // Detect next logical semester number (e.g. if semesters 1 and 2 exist, default to 3)
    const existingNums = semesters.map((s) => s.semesterNumber);
    let nextNum = 1;
    while (existingNums.includes(nextNum)) {
      nextNum++;
    }

    const semId = "sem_" + Math.random().toString(36).substr(2, 9);
    const newSem: Semester = {
      id: semId,
      userId: currentUser.uid,
      semesterNumber: nextNum,
      sgpa: 0,
      totalCredits: 0,
      subjects: [],
      createdAt: null, // assigned by Firestore serverTimestamp during create
      updatedAt: null,
    };

    // Optimistic state sync
    const updatedSems = [...semesters, newSem].sort((a, b) => a.semesterNumber - b.semesterNumber);
    setSemesters(updatedSems);
    setSyncStatus((prev) => ({ ...prev, [semId]: true }));

    try {
      const semDocRef = doc(db, "users", currentUser.uid, "semesters", semId);
      await setDoc(semDocRef, {
        id: semId,
        userId: currentUser.uid,
        semesterNumber: nextNum,
        sgpa: 0,
        totalCredits: 0,
        subjects: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Reload to pull accurate Firestore Timestamp objects
      await loadUserData(currentUser.uid);
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/semesters/${semId}`);
      } catch (mappedError: any) {
        alert(`Writing error: ${mappedError.message}`);
      }
    } finally {
      setSyncStatus((prev) => ({ ...prev, [semId]: false }));
    }
  };

  // Update a single Semester record and save to Firestore
  const handleSemesterUpdate = async (updatedSem: Semester) => {
    if (!currentUser) return;

    // Update locally instantly for responsiveness
    setSemesters((prev) =>
      prev.map((s) => (s.id === updatedSem.id ? updatedSem : s)).sort((a, b) => a.semesterNumber - b.semesterNumber)
    );

    setSyncStatus((prev) => ({ ...prev, [updatedSem.id]: true }));

    try {
      const semDocRef = doc(db, "users", currentUser.uid, "semesters", updatedSem.id);

      // Find local semester to preserve exact createdAt timestamp
      const localSem = semesters.find((s) => s.id === updatedSem.id);

      await setDoc(semDocRef, {
        id: updatedSem.id,
        userId: currentUser.uid,
        semesterNumber: Number(updatedSem.semesterNumber),
        sgpa: Number(updatedSem.sgpa),
        totalCredits: Number(updatedSem.totalCredits),
        subjects: updatedSem.subjects,
        createdAt: localSem?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/semesters/${updatedSem.id}`);
      } catch (mappedError: any) {
        alert(`Failed syncing database changes: ${mappedError.message}`);
      }
    } finally {
      setSyncStatus((prev) => ({ ...prev, [updatedSem.id]: false }));
    }
  };

  // Absolute terminal deletion of Semester record
  const handleSemesterDelete = async (semId: string) => {
    if (!currentUser) return;

    // Optimistic remove
    setSemesters((prev) => prev.filter((s) => s.id !== semId));

    try {
      const semDocRef = doc(db, "users", currentUser.uid, "semesters", semId);
      await deleteDoc(semDocRef);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete the semester document. Please verify network link.");
      // Rollback local change
      await loadUserData(currentUser.uid);
    }
  };

  // Perform dynamic aggregations
  const { cgpa, cumulativeCredits } = calculateCumulativeCgpa(semesters);

  if (!authCheckComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090b11]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <GraduationCap className="w-7 h-7 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-xs font-mono font-bold tracking-widest text-slate-400 mt-6 uppercase">
          Initializing Academic Environment
        </p>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen pb-20 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-500 relative selection:bg-teal-500/20 selection:text-teal-400">
        <DynamicBackground darkMode={darkMode} />

        {/* Global Toolbar Header */}
        <header className="sticky top-0 z-45 backdrop-blur-md bg-white/20 dark:bg-slate-950/20 border-b border-slate-200/5 px-6 py-4.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
              <span className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 text-white rounded-xl shadow-md">
                <BrainCircuit className="w-4.5 h-4.5" />
              </span>
              Academic SGPA & CGPA
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 uppercase tracking-widest border border-teal-500/20">
                Autonomous
              </span>
            </h1>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-3 bg-white/30 dark:bg-slate-900/30 hover:bg-white/50 dark:hover:bg-slate-900/50 rounded-2xl border border-white/20 dark:border-slate-800/20 transition-all cursor-pointer"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {profile && (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/15 dark:border dark:border-white/10 rounded-2xl text-white dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Primary Page Canvas */}
        <main className="max-w-6xl mx-auto px-4 md:px-8 pt-10 grid grid-cols-1 gap-8 relative z-10">
          {dbError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 md:p-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-rose-200 space-y-4 max-w-xl mx-auto backdrop-blur-md"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-sans font-extrabold text-red-400 text-base">
                    Database Connection Error
                  </h3>
                  <p className="font-sans text-xs mt-2 text-slate-350 dark:text-slate-300 font-normal leading-relaxed">
                    {dbError}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => currentUser && loadUserData(currentUser.uid)}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Retry Connection
                </button>
                <button
                  onClick={async () => {
                    setDbError(null);
                    await signOut(auth);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Sign Out & Reset
                </button>
              </div>
            </motion.div>
          )}

          {!profile ? (
            /* Auth screen */
            <AuthPage onAuthSuccess={() => currentUser && loadUserData(currentUser.uid)} />
          ) : (
            /* Student details panel and scorecards */
            <>
              {/* Profile Card & Score Banner nested group */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/30 dark:bg-slate-900/40 p-6 md:p-8 rounded-3xl border border-white/20 dark:border-slate-800/20 shadow-xl"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  {/* Left profile information */}
                  <div className="flex gap-4 items-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 flex items-center justify-center border border-teal-550/30 text-teal-600 dark:text-teal-400">
                      <School className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                        {profile.name}
                        <Sparkles className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
                      </h2>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">{profile.college}</span>
                        <span className="mx-2 text-slate-350">|</span>
                        {profile.department}
                      </div>
                    </div>
                  </div>

                  {/* Cumulative stats block */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-white/20 dark:bg-slate-950/20 p-4 rounded-2xl border border-white/10 dark:border-slate-900/40 w-full lg:w-auto">
                    {/* CGPA */}
                    <div className="text-left md:text-right pr-4 border-r border-slate-300/10">
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1">
                        Cumulative CGPA
                      </span>
                      <span className="text-3xl font-black text-teal-500 dark:text-teal-400 font-mono tracking-tight leading-none block">
                        {cgpa.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-450 block mt-1">
                        10-Point Scale
                      </span>
                    </div>

                    {/* Total completed Credits */}
                    <div className="text-left md:text-right pr-0 sm:pr-4 border-r-0 sm:border-r border-slate-300/10">
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1">
                        Sum Credits
                      </span>
                      <span className="text-3xl font-black text-slate-705 dark:text-slate-300 font-mono tracking-tight leading-none block">
                        {cumulativeCredits}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-450 block mt-1">
                        Completed Credits
                      </span>
                    </div>

                    {/* Semesters recorded */}
                    <div className="text-left md:text-right col-span-2 sm:col-span-1 border-t border-slate-350/10 sm:border-t-0 pt-3 sm:pt-0">
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1">
                        Recorded Sem
                      </span>
                      <span className="text-3xl font-black text-indigo-500 dark:text-indigo-400 font-mono tracking-tight leading-none block">
                        {semesters.length}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-450 block mt-1">
                        Active Semesters
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main dynamic semesters list */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-500" />
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Semester-wise Mark Sheets
                  </h3>
                </div>

                <button
                  onClick={addNewSemester}
                  disabled={masterLoading}
                  className="px-5.5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs rounded-2xl transition-all shadow-lg hover:shadow-teal-500/25 active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Record New Semester
                </button>
              </div>

              {/* Loop rendering semester evaluation tables */}
              <div className="space-y-8">
                {semesters.map((sem) => (
                  <SemesterTable
                    key={sem.id}
                    semester={sem}
                    onUpdate={handleSemesterUpdate}
                    onDelete={handleSemesterDelete}
                    syncing={syncStatus[sem.id] || false}
                  />
                ))}

                {semesters.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-16 text-center backdrop-blur-xl bg-white/20 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800/20 rounded-3xl shadow-md"
                  >
                    <BookMarked className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-4 animate-bounce" />
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-350">
                      Your Academic Journal is Blank
                    </h4>
                    <p className="text-xs text-slate-550 dark:text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                      Start recording your grades. Click 'Record New Semester' to add dynamic course modules, credits, and evaluation markings.
                    </p>
                    <button
                      onClick={addNewSemester}
                      className="mt-6 px-6 py-3 bg-slate-850 hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-extrabold text-xs rounded-2xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Your First Semester
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
