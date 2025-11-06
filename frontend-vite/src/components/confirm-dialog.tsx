import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  isDestructive = false,
  isLoading = false
}: ConfirmDialogProps) {
  const { t } = useTranslation(['common'])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-4 border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center border-4 border-border ${
              isDestructive ? 'bg-red-500' : 'bg-yellow-500'
            }`}>
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-black uppercase text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-3 font-bold">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="font-black uppercase border-4"
          >
            {cancelText || t('common:cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`font-black uppercase border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${
              isDestructive ? 'bg-red-500 hover:bg-red-600' : ''
            }`}
          >
            {isLoading ? t('common:loading') : (confirmText || t('common:confirm'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
