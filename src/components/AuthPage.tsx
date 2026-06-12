import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { motion } from "motion/react";
import { School, User, Lock, Mail, ChevronRight, LogIn, Sparkles, GraduationCap } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpNotAllowedError, setIsOpNotAllowedError] = useState(false);
  const [loading, setLoading] = useState(false);

  // States for secondary profile creation
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [tempUid, setTempUid] = useState("");
  const [tempEmail, setTempEmail] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setIsOpNotAllowedError(false);

    try {
      if (isSignUp) {
        // Create user
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;
        setTempUid(user.uid);
        setTempEmail(user.email || "");
        setNeedsProfileSetup(true);
      } else {
        // Log in
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Check if profile exists
        const userDocRef = doc(db, "users", credential.user.uid);
        const profileSnap = await getDoc(userDocRef);

        if (!profileSnap.exists()) {
          setTempUid(credential.user.uid);
          setTempEmail(credential.user.email || "");
          setNeedsProfileSetup(true);
        } else {
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "An authentication error occurred.";
      if (err.code === "auth/operation-not-allowed") {
        setIsOpNotAllowedError(true);
        msg = "Email/Password sign-in is disabled in your Firebase Console. Please enable it under Authentication -> Sign-in method, or use Google Login below.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "Email is already in use. Try signing in instead.";
      } else if (err.code === "auth/invalid-credential") {
        msg = "Incorrect email or password combination. Please try again.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password must be at least 6 characters long.";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    setIsOpNotAllowedError(false);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const profileSnap = await getDoc(userDocRef);

      if (!profileSnap.exists()) {
        setTempUid(user.uid);
        setTempEmail(user.email || "");
        setFullName(user.displayName || "");
        setNeedsProfileSetup(true);
      } else {
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "An error occurred during Google sign-in.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "The sign-in popup was closed before completing authentication. Please click 'Sign In with Google' again and allow it to finish.";
      } else if (err.code === "auth/popup-blocked") {
        msg = "The sign-in popup was blocked by your browser. Please click the pop-up unblocker icon in your browser address bar and enable it, or click the 'Open in New Tab' button in the upper right-hand corner of the page preview to run independently.";
      } else if (err.message?.includes("Pending promise was never set") || err.code === "auth/internal-error") {
        msg = "Iframe cookie / login restriction detected. Please bypass this by opening the application in a new tab (click the icon in the very top-right page preview panel) to authorize instantly.";
      } else if (err.code === "auth/invalid-credential") {
        msg = "Your login request could not be completed with this credential. Please try Google sign-in or check your input credentials.";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !collegeName || !department) {
      setErrorMsg("All fields are required to complete your profile registration.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const targetUid = tempUid || auth.currentUser?.uid;
      const targetEmail = tempEmail || auth.currentUser?.email || "";

      if (!targetUid) {
        throw new Error("No active user ID found to attach profile.");
      }

      await setDoc(doc(db, "users", targetUid), {
        uid: targetUid,
        email: targetEmail,
        name: fullName,
        college: collegeName,
        department: department,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${tempUid}`);
      } catch (mappedError: any) {
        setErrorMsg(`Database setup error: ${mappedError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 p-8 rounded-3xl border border-white/20 dark:border-slate-800/20 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Spot */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 rounded-2xl mb-4 shadow-inner">
            <GraduationCap className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-800 dark:text-slate-100">
            {needsProfileSetup
              ? "Complete Profile Setup"
              : isSignUp
              ? "Join Academic Hub"
              : "Access Academic Records"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {needsProfileSetup
              ? "Tell us about your autonomous engineering college"
              : "Grade tracking tailored for leading engineering campuses"}
          </p>
        </div>

        {errorMsg && !isOpNotAllowedError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 font-mono"
          >
            {errorMsg}
          </motion.div>
        )}

        {isOpNotAllowedError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/25 border border-amber-200/40 dark:border-amber-900/30 text-xs text-slate-700 dark:text-slate-200 space-y-3 shadow-inner"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg bg-amber-100 dark:bg-amber-900/40 p-1.5 rounded-xl">⚠️</span>
              <div>
                <p className="font-sans font-bold text-amber-800 dark:text-amber-400 text-sm">
                  Email/Password provider is disabled
                </p>
                <p className="font-sans text-[11px] mt-1 text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                  In Firebase, Email/Password login/signup is disabled by default for new projects. Follow these quick steps to enable it:
                </p>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-2 pl-1 font-sans text-[11px] text-slate-650 dark:text-slate-350 bg-white/40 dark:bg-slate-900/45 p-3.5 rounded-2xl border border-slate-200/20">
              <li>
                Click the direct link below to open your console:
                <div className="my-2.5">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0237697239/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all text-[9.5px] uppercase tracking-wider"
                  >
                    Configure Firebase Auth ↗
                  </a>
                </div>
              </li>
              <li>Under the <strong>"Sign-in method"</strong> tab, click <strong>"Add new provider"</strong>.</li>
              <li>Select <strong>Email/Password</strong>, toggle <strong>"Enable"</strong>, and click <strong>"Save"</strong>.</li>
              <li>Once saved, come back to this page and try again!</li>
            </ol>

            <div className="pt-2 border-t border-dashed border-amber-250 dark:border-amber-900/20 font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 <strong>Instant Access Option:</strong> Use the <span className="font-semibold text-teal-600 dark:text-teal-400">Google SSO option</span> right below to sign in instantly with zero setup required.
            </div>
          </motion.div>
        )}

        {needsProfileSetup ? (
          /* Profile completion flow */
          <form onSubmit={submitProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-300/30 dark:border-slate-700/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Engineering College Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <School className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. CoEP Autonomous College"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-300/30 dark:border-slate-700/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Branch / Engineering Department
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <Sparkles className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-300/30 dark:border-slate-700/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-teal-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? "Finalizing Account..." : "Confirm & Setup Student Dashboard"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          /* Standard Auth flows */
          <>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Academic Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-300/30 dark:border-slate-700/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-300/30 dark:border-slate-700/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-2xl transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer pt-4"
              >
                {loading ? (
                  "Loading..."
                ) : isSignUp ? (
                  <>
                    <Sparkles className="w-4 h-4" /> Sign Up / Start Track
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Access Account
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <span className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-300/30 dark:bg-slate-700/30" />
              <span className="relative bg-white/80 dark:bg-slate-900/80 px-3 text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold font-sans">
                or use Google SSO
              </span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-850 border border-slate-300/30 dark:border-slate-700/30 rounded-2xl text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.91-4.53-6.16-4.53z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google
            </button>

            <div className="text-center mt-6">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-teal-600 dark:text-teal-400 hover:underline text-xs font-semibold cursor-pointer"
              >
                {isSignUp
                  ? "Already have an account? Log In"
                  : "Don't have an account yet? Create one here"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
