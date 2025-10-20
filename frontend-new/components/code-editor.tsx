"use client"

import { useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import type { OnMount } from "@monaco-editor/react"
import { useTheme } from "@/components/theme-provider"

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
  const { theme } = useTheme()

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Configure Monaco dark theme with better colors
    monaco.editor.defineTheme("codegrader-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "A78BFA", fontStyle: "bold" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "FB923C" },
        { token: "function", foreground: "60A5FA" },
        { token: "variable", foreground: "E5E7EB" },
        { token: "type", foreground: "10B981" },
      ],
      colors: {
        "editor.background": "#1A1A23",
        "editor.foreground": "#E5E7EB",
        "editor.lineHighlightBackground": "#252532",
        "editor.selectionBackground": "#374151",
        "editorCursor.foreground": "#A78BFA",
        "editorLineNumber.foreground": "#6B7280",
        "editorLineNumber.activeForeground": "#A78BFA",
        "editorIndentGuide.background": "#374151",
        "editorIndentGuide.activeBackground": "#6B7280",
        "editorWhitespace.foreground": "#374151",
      },
    })

    // Configure Monaco light theme
    monaco.editor.defineTheme("codegrader-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "9CA3AF", fontStyle: "italic" },
        { token: "keyword", foreground: "7C3AED", fontStyle: "bold" },
        { token: "string", foreground: "059669" },
        { token: "number", foreground: "EA580C" },
        { token: "function", foreground: "2563EB" },
        { token: "variable", foreground: "374151" },
        { token: "type", foreground: "047857" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#1F2937",
        "editor.lineHighlightBackground": "#F9FAFB",
        "editor.selectionBackground": "#E0E7FF",
        "editorCursor.foreground": "#7C3AED",
        "editorLineNumber.foreground": "#9CA3AF",
        "editorLineNumber.activeForeground": "#7C3AED",
        "editorIndentGuide.background": "#E5E7EB",
        "editorIndentGuide.activeBackground": "#9CA3AF",
        "editorWhitespace.foreground": "#E5E7EB",
      },
    })

    monaco.editor.setTheme(theme === "dark" ? "codegrader-dark" : "codegrader-light")
  }

  useEffect(() => {
    if (editorRef.current) {
      const monaco = editorRef.current._themeService?._theme?.themeName
      editorRef.current._themeService?.setTheme(theme === "dark" ? "codegrader-dark" : "codegrader-light")
    }
  }, [theme])

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
