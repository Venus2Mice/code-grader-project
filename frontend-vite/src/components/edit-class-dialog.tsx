import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit } from "lucide-react"
import { useTranslation } from "react-i18next"

interface EditClassDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateClass: (data: { name?: string; course_code?: string; description?: string }) => Promise<void>
  currentData: {
    name: string
    course_code: string
    description: string
  }
}

export function EditClassDialog({ isOpen, onClose, onUpdateClass, currentData }: EditClassDialogProps) {
  const { t } = useTranslation(['teacher', 'common'])
  const [name, setName] = useState(currentData.name)
  const [courseCode, setCourseCode] = useState(currentData.course_code)
  const [description, setDescription] = useState(currentData.description)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setName(currentData.name)
    setCourseCode(currentData.course_code)
    setDescription(currentData.description)
  }, [currentData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError(t('teacher:class.nameRequired'))
      return
    }

    try {
      setIsSubmitting(true)
      await onUpdateClass({
        name: name.trim(),
        course_code: courseCode.trim() || undefined,
        description: description.trim() || undefined
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.msg || t('teacher:class.updateError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg border-4 border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-border bg-primary text-primary-foreground">
              <Edit className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-black uppercase text-foreground">
              {t('teacher:class.editClass')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-3 font-bold">
            {t('teacher:class.editClassDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-black uppercase text-foreground">
              {t('teacher:class.className')} *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t('teacher:class.classNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-4 border-border font-bold"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseCode" className="text-sm font-black uppercase text-foreground">
              {t('teacher:class.courseCode')}
            </Label>
            <Input
              id="courseCode"
              type="text"
              placeholder={t('teacher:class.courseCodePlaceholder')}
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="border-4 border-border font-bold"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-black uppercase text-foreground">
              {t('teacher:class.description')}
            </Label>
            <Textarea
              id="description"
              placeholder={t('teacher:class.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-4 border-border font-bold min-h-[100px]"
              disabled={isSubmitting}
            />
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
              {isSubmitting ? t('common:updating') : t('teacher:class.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
