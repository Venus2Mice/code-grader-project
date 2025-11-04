
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Play, History, CheckCircle, RotateCcw, Upload } from "lucide-react"
import { LanguageDropdown } from "@/components/LanguageDropdown"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"
import type { Problem } from "@/types"

interface ProblemHeaderProps {
  problem: Problem
  classId: string | null  // This is actually classToken but keeping prop name for compatibility
  language: string
  onLanguageChange: (lang: string) => void
  onReset: () => void
  onUpload: () => void
  onHistory: () => void
  onRun: () => void
  onSubmit: () => void
  isRunning: boolean
  isSubmitting: boolean
  submissionsCount: number
  hasResetTemplate: boolean
}

export function ProblemHeader({
  problem,
  classId,  // This is actually classToken but keeping prop name for compatibility
  language,
  onLanguageChange,
  onReset,
  onUpload,
  onHistory,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  submissionsCount,
  hasResetTemplate
}: ProblemHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="border-b-4 border-border bg-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 md:px-6 py-4">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {classId ? (
            <Link
              to={`/student/class/${classId}`}
              className="inline-flex items-center gap-2 border-4 border-border bg-yellow-400 px-3 md:px-4 py-2 text-xs md:text-sm font-black uppercase text-foreground transition-all hover:bg-cyan-300 hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">BACK</span>
            </Link>
          ) : (
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 border-4 border-border bg-yellow-400 px-3 md:px-4 py-2 text-xs md:text-sm font-black uppercase text-foreground transition-all hover:bg-cyan-300 hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">BACK</span>
            </Link>
          )}
          <div className="hidden md:block h-8 w-1 bg-border" />
          <h1 className="text-sm md:text-lg font-black uppercase text-foreground line-clamp-1">{problem.title}</h1>
          <span
            className={`border-4 border-border px-2 md:px-3 py-1 text-xs font-black uppercase ${
              problem.difficulty === "easy"
                ? "bg-green-500/20 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-500"
                : problem.difficulty === "medium"
                  ? "bg-yellow-500/20 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500"
                  : "bg-red-500/20 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500"
            }`}
          >
            {problem.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <ThemeSwitcher />

          <LanguageDropdown value={language} onChange={onLanguageChange} />

          {hasResetTemplate && (
            <button
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-4 border-border bg-blue-400 
                         hover:bg-blue-300 hover:translate-x-1 hover:translate-y-1 
                         transition-all font-black uppercase text-xs md:text-sm
                         shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              onClick={onReset}
              title="Reset code to original template"
            >
              <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          )}

          <button
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-4 border-border bg-purple-400 
                       hover:bg-purple-300 hover:translate-x-1 hover:translate-y-1 
                       transition-all font-black uppercase text-xs md:text-sm
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            onClick={onUpload}
            disabled={isRunning || isSubmitting}
            title="Upload .cpp or .txt file"
          >
            <Upload className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">UPLOAD</span>
          </button>

          <button
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-4 border-border bg-orange-400 
                       hover:bg-orange-300 hover:translate-x-1 hover:translate-y-1 
                       transition-all font-black uppercase text-xs md:text-sm
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            onClick={onHistory}
          >
            <History className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">HISTORY ({submissionsCount})</span>
            <span className="sm:hidden">({submissionsCount})</span>
          </button>

          <button
            onClick={onRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-4 border-border bg-green-400 
                       hover:bg-green-300 hover:translate-x-1 hover:translate-y-1 
                       transition-all font-black uppercase text-xs md:text-sm
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            <Play className="h-4 w-4 md:h-5 md:w-5" />
            {isRunning ? "RUNNING..." : "RUN"}
          </button>

          <button
            onClick={onSubmit}
            disabled={isSubmitting || isRunning}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-4 border-border bg-pink-400 
                       hover:bg-pink-300 hover:translate-x-1 hover:translate-y-1 
                       transition-all font-black uppercase text-xs md:text-sm
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
            {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
          </button>
        </div>
      </div>
    </div>
  )
}
