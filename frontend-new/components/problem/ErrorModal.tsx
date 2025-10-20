"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-4 border-black">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 font-black uppercase ${
            isAnalysis ? 'text-blue-600' : 'text-red-600'
          }`}>
            {isAnalysis ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isAnalysis ? (
            <div className="space-y-4">
              {message.split('\n\n').map((section, idx) => {
                if (section.includes('File:')) {
                  return (
                    <div key={idx} className="bg-purple-50 border-4 border-purple-600 p-4">
                      <p className="text-sm font-black text-purple-900">
                        {section}
                      </p>
                    </div>
                  )
                } else if (section.includes('✅ Complete program') || section.includes('✅ Your code')) {
                  return (
                    <div key={idx} className="bg-green-50 border-4 border-green-600 p-4">
                      <pre className="text-sm font-bold text-green-900 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else if (section.includes('⚠️')) {
                  return (
                    <div key={idx} className="bg-yellow-50 border-4 border-yellow-400 p-4">
                      <pre className="text-sm font-bold text-yellow-900 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else if (section.includes('❌')) {
                  return (
                    <div key={idx} className="bg-red-50 border-4 border-red-600 p-4">
                      <pre className="text-sm font-bold text-red-900 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else if (section.includes('📌 Current problem')) {
                  return (
                    <div key={idx} className="bg-blue-50 border-4 border-blue-600 p-4">
                      <pre className="text-sm font-bold text-blue-900 whitespace-pre-wrap">
                        {section}
                      </pre>
                    </div>
                  )
                } else {
                  return (
                    <div key={idx} className="bg-gray-50 border-2 border-gray-300 p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {section}
                      </p>
                    </div>
                  )
                }
              })}
            </div>
          ) : hasRuntimeError ? (
            <>
              <div className="bg-red-50 border-4 border-red-600 p-4">
                <p className="text-sm font-black text-red-900 mb-2 uppercase">
                  ❌ Chi tiết lỗi:
                </p>
                <pre className="bg-background border-2 border-red-400 p-3 rounded text-sm font-mono text-red-700 whitespace-pre-wrap overflow-x-auto">
{message.split('='.repeat(50))[0].trim()}
                </pre>
              </div>
              
              <div className="bg-blue-50 border-4 border-blue-600 p-4">
                <p className="text-sm font-black text-blue-900 mb-3 uppercase">
                  💡 Hướng dẫn & Gợi ý:
                </p>
                <pre className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
{message.split('='.repeat(50))[1]?.trim() || ''}
                </pre>
              </div>
              
              <div className="bg-yellow-50 border-4 border-yellow-400 p-4">
                <p className="text-sm font-black text-yellow-900 mb-2 uppercase">
                  ⚡ Debug Tips:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  <li>Chạy thử với test case đơn giản để xác định vấn đề</li>
                  <li>Thêm <code className="bg-yellow-200 px-1 py-0.5 rounded">cout</code> để kiểm tra giá trị biến</li>
                  <li>Kiểm tra các trường hợp biên (edge cases)</li>
                  <li>Đảm bảo khởi tạo tất cả biến trước khi sử dụng</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-red-50 border-4 border-red-600 p-4 rounded">
              <p className="text-sm font-bold text-red-900 mb-3">
                Your code has compilation errors. Please fix them before submitting:
              </p>
              <pre className="bg-background border-2 border-red-400 p-4 rounded text-sm font-mono text-red-700 whitespace-pre-wrap overflow-x-auto">
{message}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button 
            onClick={onClose}
            className="font-black uppercase border-2 border-black"
          >
            ✓ GOT IT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
