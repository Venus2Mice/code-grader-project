import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Mail } from "lucide-react"
import { useTranslation } from "react-i18next"

interface AddStudentDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddStudent: (email: string) => Promise<void>
}

export function AddStudentDialog({ isOpen, onClose, onAddStudent }: AddStudentDialogProps) {
  const { t } = useTranslation(['teacher', 'common'])
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError(t('teacher:class.emailRequired'))
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t('teacher:class.invalidEmail'))
      return
    }

    try {
      setIsSubmitting(true)
      await onAddStudent(email.trim())
      setEmail("")
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.msg || t('teacher:class.addStudentError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-4 border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-border bg-primary text-primary-foreground">
              <UserPlus className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-black uppercase text-foreground">
              {t('teacher:class.addStudent')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-3 font-bold">
            {t('teacher:class.addStudentDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-black uppercase text-foreground">
              {t('teacher:class.studentEmail')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-4 border-border font-bold"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="border-4 border-red-500 bg-red-100 dark:bg-red-900/20 px-4 py-3">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="font-black uppercase border-4"
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-black uppercase border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {isSubmitting ? t('common:adding') : t('teacher:class.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
