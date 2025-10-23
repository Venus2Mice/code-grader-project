
import { Upload, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
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
      <DialogContent className="max-w-2xl border-4 border-border bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase text-purple-600 dark:text-purple-400">
            <Upload className="h-6 w-6" />
            Upload Code
          </DialogTitle>
          <DialogDescription>
            Upload your code file or extract code from an image using OCR
          </DialogDescription>
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
            <div className="bg-blue-50 dark:bg-blue-950/30 border-4 border-blue-600 dark:border-blue-500 p-4">
              <p className="font-black uppercase text-blue-900 dark:text-blue-300 mb-2 text-sm">
                📁 Accepted File Types:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li><code className="bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded font-bold">.cpp</code> - C++ source files</li>
                <li><code className="bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded font-bold">.py</code> - Python source files</li>
                <li><code className="bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded font-bold">.java</code> - Java source files</li>
                <li><code className="bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded font-bold">.txt</code> - Text files (for editing only)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/30 border-4 border-yellow-400 dark:border-yellow-500 p-3">
              <p className="text-sm font-black text-yellow-900 dark:text-yellow-300 uppercase">
                ⚠️ Important:
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                The uploaded file will use the currently selected language for grading.
              </p>
            </div>

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-4 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30'
                  : 'border-muted-foreground/30 bg-muted hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".cpp,.py,.java,.txt"
                onChange={onFileUpload}
                className="hidden"
              />
              
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
              
              <p className="font-black uppercase text-lg mb-2 text-foreground">
                {isDragging ? 'Drop file here!' : 'Drag & Drop your file here'}
              </p>
              
              <p className="text-sm text-muted-foreground mb-4">
                or
              </p>
              
              <Button
                type="button"
                variant="outline"
                className="font-black uppercase border-2 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-600 dark:hover:bg-purple-700 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                Browse Files
              </Button>
            </div>

            {uploadedFileName && (
              <div className="bg-green-50 dark:bg-green-950/30 border-4 border-green-600 dark:border-green-500 p-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-bold text-green-900 dark:text-green-300">
                  Last uploaded: <code className="bg-green-200 dark:bg-green-900 px-2 py-0.5 rounded">{uploadedFileName}</code>
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
            className="font-black uppercase border-2 border-border"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
