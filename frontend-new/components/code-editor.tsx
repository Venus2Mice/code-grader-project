"use client"

import { useRef } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
}

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Configure Monaco theme
    monaco.editor.defineTheme("codegrader-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#e5e5e5",
        "editorLineNumber.foreground": "#525252",
        "editorLineNumber.activeForeground": "#a855f7",
      },
    })

    monaco.editor.setTheme("codegrader-dark")
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
      }}
    />
  )
}
