"use client"

import { Upload, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageToCodeUpload } from "@/components/image-to-code-upload"

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  isDragging: boolean
  uploadedFileName: string | null
  language: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onCodeExtracted: (code: string) => void
}

export function FileUploadModal({
  isOpen,
  onClose,
  isDragging,
  uploadedFileName,
  language,
  fileInputRef,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onCodeExtracted
}: FileUploadModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase text-purple-600">
            <Upload className="h-6 w-6" />
            Upload Code
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="font-black uppercase">
              📁 File Upload
            </TabsTrigger>
            <TabsTrigger value="image" className="font-black uppercase">
              📷 Image Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="bg-blue-50 border-4 border-blue-600 p-4">
              <p className="font-black uppercase text-blue-900 mb-2 text-sm">
                📁 Accepted File Types:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li><code className="bg-blue-200 px-2 py-0.5 rounded font-bold">.cpp</code> - C++ source files (for submission)</li>
                <li><code className="bg-blue-200 px-2 py-0.5 rounded font-bold">.txt</code> - Text files (for editing only)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-4 border-yellow-400 p-3">
              <p className="text-sm font-black text-yellow-900 uppercase">
                ⚠️ Important:
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Only <span className="font-bold">.cpp files</span> can be submitted for grading. 
                .txt files are for viewing and editing purposes only.
              </p>
            </div>

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-4 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".cpp,.txt"
                onChange={onFileUpload}
                className="hidden"
              />
              
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
              
              <p className="font-black uppercase text-lg mb-2">
                {isDragging ? 'Drop file here!' : 'Drag & Drop your file here'}
              </p>
              
              <p className="text-sm text-muted-foreground mb-4">
                or
              </p>
              
              <Button
                type="button"
                variant="outline"
                className="font-black uppercase border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                Browse Files
              </Button>
            </div>

            {uploadedFileName && (
              <div className="bg-green-50 border-4 border-green-600 p-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-bold text-green-900">
                  Last uploaded: <code className="bg-green-200 px-2 py-0.5 rounded">{uploadedFileName}</code>
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            <ImageToCodeUpload
              language={language}
              onCodeExtracted={onCodeExtracted}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="font-black uppercase border-2 border-black"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
