
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Play, History, CheckCircle, RotateCcw, Upload, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/components/theme-provider"
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
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="border-b-4 border-border bg-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 md:px-6 py-4">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {classId ? (
            <Link
              to={`/student/class/${classId}`}
              className="inline-flex items-center gap-2 border-4 border-border bg-muted px-3 md:px-4 py-2 text-xs md:text-sm font-black uppercase text-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">BACK</span>
            </Link>
          ) : (
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 border-4 border-border bg-muted px-3 md:px-4 py-2 text-xs md:text-sm font-black uppercase text-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]"
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
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2 font-black uppercase text-xs md:text-sm bg-background hover:bg-muted hover:text-foreground"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            <span className="hidden sm:inline">{theme === "dark" ? "LIGHT" : "DARK"}</span>
          </Button>

          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-24 md:w-32 font-black uppercase text-xs md:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
            </SelectContent>
          </Select>

          {hasResetTemplate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-black uppercase bg-background text-xs md:text-sm hover:bg-blue-100 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-700 dark:hover:border-blue-500"
              onClick={onReset}
              title="Reset code to original template"
            >
              <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">RESET</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-black uppercase bg-transparent text-xs md:text-sm hover:bg-purple-100 dark:hover:bg-purple-950 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-700 dark:hover:border-purple-500"
            onClick={onUpload}
            disabled={isRunning || isSubmitting}
            title="Upload .cpp or .txt file"
          >
            <Upload className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">UPLOAD</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-black uppercase bg-transparent text-xs md:text-sm"
            onClick={onHistory}
          >
            <History className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">HISTORY ({submissionsCount})</span>
            <span className="sm:hidden">({submissionsCount})</span>
          </Button>

          <Button
            variant="outline"
            onClick={onRun}
            disabled={isRunning || isSubmitting}
            className="gap-2 font-black uppercase text-xs md:text-sm bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 text-white border-border"
          >
            <Play className="h-4 w-4 md:h-5 md:w-5" />
            {isRunning ? "RUNNING..." : "RUN"}
          </Button>

          <Button
            onClick={onSubmit}
            disabled={isSubmitting || isRunning}
            className="gap-2 font-black uppercase text-xs md:text-sm"
          >
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
            {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
          </Button>
        </div>
      </div>
    </div>
  )
}
