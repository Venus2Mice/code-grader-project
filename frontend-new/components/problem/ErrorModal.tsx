"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
}

export function ErrorModal({ isOpen, onClose, title, message }: ErrorModalProps) {
  const isAnalysis = title.includes('Analysis')
  const hasRuntimeError = message.includes('='.repeat(50))
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-4 border-border bg-card">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 font-black uppercase ${
            isAnalysis ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {isAnalysis ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isAnalysis ? 'Code analysis results and recommendations' : 'Error details and debugging information'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isAnalysis ? (
            <div className="space-y-4">
              {message.split('\n\n').map((section, idx) => {
                if (section.includes('File:')) {
                  return (
                    <div key={idx} className="bg-purple-50 dark:bg-purple-950/30 border-4 border-purple-600 dark:border-purple-500 p-4">
                      <p className="text-sm font-black text-purple-900 dark:text-purple-300">
                        {section}
                      </p>
                    </div>
                  )
                } else if (section.includes('✅ Complete program') || section.includes('✅ Your code')) {
                  return (
                    <div key={idx} className="bg-green-50 dark:bg-green-950/30 border-4 border-green-600 dark:border-green-500 p-4">
                      <pre className="text-sm font-bold text-green-900 dark:text-green-300 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else if (section.includes('⚠️')) {
                  return (
                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-950/30 border-4 border-yellow-400 dark:border-yellow-500 p-4">
                      <pre className="text-sm font-bold text-yellow-900 dark:text-yellow-300 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else if (section.includes('❌')) {
                  return (
                    <div key={idx} className="bg-red-50 dark:bg-red-950/30 border-4 border-red-600 dark:border-red-500 p-4">
                      <pre className="text-sm font-bold text-red-900 dark:text-red-300 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else if (section.includes('📌 Current problem')) {
                  return (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-950/30 border-4 border-blue-600 dark:border-blue-500 p-4">
                      <pre className="text-sm font-bold text-blue-900 dark:text-blue-300 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else {
                  return (
                    <div key={idx} className="bg-muted border-2 border-border p-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {section}
                      </p>
                    </div>
                  )
                }
              })}
            </div>
          ) : hasRuntimeError ? (
            <>
              <div className="bg-red-50 dark:bg-red-950/30 border-4 border-red-600 dark:border-red-500 p-4">
                <p className="text-sm font-black text-red-900 dark:text-red-300 mb-2 uppercase">
                  ❌ Chi tiết lỗi:
                </p>
                <pre className="bg-card border-2 border-red-400 dark:border-red-600 p-3 rounded text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-x-auto">
{message.split('='.repeat(50))[0].trim()}
                </pre>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 border-4 border-blue-600 dark:border-blue-500 p-4">
                <p className="text-sm font-black text-blue-900 dark:text-blue-300 mb-3 uppercase">
                  💡 Hướng dẫn & Gợi ý:
                </p>
                <pre className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap leading-relaxed">
{message.split('='.repeat(50))[1]?.trim() || ''}
                </pre>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border-4 border-yellow-400 dark:border-yellow-500 p-4">
                <p className="text-sm font-black text-yellow-900 dark:text-yellow-300 mb-2 uppercase">
                  ⚡ Debug Tips:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                  <li>Chạy thử với test case đơn giản để xác định vấn đề</li>
                  <li>Thêm <code className="bg-yellow-200 dark:bg-yellow-900 px-1 py-0.5 rounded">cout</code> để kiểm tra giá trị biến</li>
                  <li>Kiểm tra các trường hợp biên (edge cases)</li>
                  <li>Đảm bảo khởi tạo tất cả biến trước khi sử dụng</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/30 border-4 border-red-600 dark:border-red-500 p-4 rounded">
              <p className="text-sm font-bold text-red-900 dark:text-red-300 mb-3">
                Your code has compilation errors. Please fix them before submitting:
              </p>
              <pre className="bg-card border-2 border-red-400 dark:border-red-600 p-4 rounded text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-x-auto">
{message}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button 
            onClick={onClose}
            className="font-black uppercase border-2 border-border"
          >
            ✓ GOT IT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
