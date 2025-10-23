import { Button } from "@/components/ui/button"
import { Code2, LogOut, User, Moon, Sun } from "lucide-react"
import { Link } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"

interface NavbarProps {
  userName?: string
  userRole?: "teacher" | "student"
  onLogout?: () => void
}

export function Navbar({ userName, userRole, onLogout }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="border-b-4 border-border bg-card">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-black uppercase tracking-tight"
        >
          <div className="h-8 w-8 md:h-10 md:w-10 bg-primary border-4 border-border flex items-center justify-center">
            <Code2 className="h-4 w-4 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">CodeGrader</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2 bg-transparent">
            {theme === "light" ? (
              <>
                <Moon className="h-4 w-4" />
                <span className="hidden md:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                <span className="hidden md:inline">Light</span>
              </>
            )}
          </Button>

          {userName && (
            <>
              <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm font-bold border-4 border-border bg-muted px-2 md:px-4 py-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{userName}</span>
                <span className="text-muted-foreground">({userRole === "teacher" ? "T" : "S"})</span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout} className="gap-1 md:gap-2 bg-transparent">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
