"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  className?: string;
}

export default function ProgressBar({
  completed,
  total,
  label,
  className = "",
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark">{label}</span>
          <span className="text-sm font-semibold text-primary">{percentage}%</span>
        </div>
      )}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={`h-full rounded-full ${
            percentage === 100
              ? "bg-green-500"
              : percentage > 50
                ? "bg-accent"
                : "bg-primary/50"
          }`}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-gray-400">
          {completed} de {total} etapas concluídas
        </span>
        {percentage === 100 && (
          <span className="text-[11px] font-medium text-green-600">
            Processo concluído ✓
          </span>
        )}
      </div>
    </div>
  );
}
