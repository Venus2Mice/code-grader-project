"use client"

import { RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ResetConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ResetConfirmModal({ isOpen, onClose, onConfirm }: ResetConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-4 border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-foreground">
            <RotateCcw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            RESET CODE?
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirm to reset your code to the initial template
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border-4 border-yellow-400 dark:border-yellow-500 p-4">
            <p className="text-sm font-bold text-yellow-900 dark:text-yellow-300 mb-2">
              ⚠️ Cảnh báo:
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Bạn có chắc chắn muốn reset code về template ban đầu?
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-bold mt-2">
              Toàn bộ code hiện tại của bạn sẽ bị xóa!
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/30 border-4 border-blue-400 dark:border-blue-500 p-4">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Lưu ý:</p>
            <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>Code template sẽ được khôi phục với function signature ban đầu</li>
              <li>Bạn có thể xem lại code cũ trong phần HISTORY</li>
              <li>Hành động này không thể hoàn tác</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline"
            onClick={onClose}
            className="font-black uppercase border-2 border-border"
          >
            HỦY BỎ
          </Button>
          <Button 
            onClick={onConfirm}
            className="font-black uppercase bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            XÁC NHẬN RESET
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
