"use client"

import { useRef } from "react"
import dynamic from "next/dynamic"
import type { OnMount } from "@monaco-editor/react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
}

// Dynamically import Monaco Editor only when needed
const Editor = dynamic(() => import("@monaco-editor/react").then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <EditorSkeleton />
})

// Loading skeleton
function EditorSkeleton() {
  return (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Loading editor...</p>
    </div>
  )
}

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Always use vs-dark theme regardless of light/dark mode
    monaco.editor.setTheme("vs-dark")
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(value) => onChange(value || "")}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: "on",
        padding: { top: 16, bottom: 16 },
        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        fontLigatures: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        renderLineHighlight: "all",
      }}
    />
  )
}
