"use client"

import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const { theme } = useTheme()
  const formatJson = () => {
    try {
      const parsed = JSON.parse(value)
      onChange(JSON.stringify(parsed, null, 2))
    } catch (error) {
      // Invalid JSON, don't format
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "")
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-4 h-[45px] flex items-center bg-muted/50">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-semibold">appwrite.config.json</h2>
          <button
            onClick={formatJson}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Format JSON
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={handleEditorChange}
          theme={theme === "dark" ? "vs-dark" : "light"}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
