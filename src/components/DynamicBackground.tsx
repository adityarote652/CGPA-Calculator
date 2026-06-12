import { motion } from "motion/react";

interface DynamicBackgroundProps {
  darkMode: boolean;
}

export default function DynamicBackground({ darkMode }: DynamicBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none transition-colors duration-700 select-none">
      {/* Base theme-driven light/dark smooth workspace floor */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          darkMode
            ? "bg-[#090b11] bg-gradient-to-br from-[#0c0f17] via-[#090d16] to-[#04060b]"
            : "bg-[#f4f7fa] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]"
        }`}
      />

      {/* Floating Glass Glowing Orbs */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-40 blur-3xl"
        style={{
          background: darkMode
            ? "radial-gradient(circle, #3b82f6 0%, #1e3a8a 100%)"
            : "radial-gradient(circle, #bcd4fa 0%, #60a5fa 100%)",
        }}
      />

      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 60, -90, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full opacity-35 blur-3xl"
        style={{
          background: darkMode
            ? "radial-gradient(circle, #ec4899 0%, #831843 100%)"
            : "radial-gradient(circle, #fbcfe8 0%, #f472b6 100%)",
        }}
      />

      <motion.div
        animate={{
          x: [0, 70, -30, 0],
          y: [0, 110, -60, 0],
          scale: [1, 1.1, 0.8, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-20 -right-20 w-[450px] h-[450px] rounded-full opacity-40 blur-3xl"
        style={{
          background: darkMode
            ? "radial-gradient(circle, #8b5cf6 0%, #4c1d95 100%)"
            : "radial-gradient(circle, #ddd6fe 0%, #a78bfa 100%)",
        }}
      />

      {/* Modern High-Blur Glass Overlay Floor */}
      <div className="absolute inset-0 backdrop-blur-[120px] pointer-events-none" />
    </div>
  );
}
