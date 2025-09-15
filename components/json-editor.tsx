"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(value)
      onChange(JSON.stringify(parsed, null, 2))
    } catch (error) {
      // Invalid JSON, don't format
    }
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
      <div className="flex-1 overflow-auto h-full">
        <textarea
          name="json-editor"
          value={value}
          onChange={handleChange}
          className="w-full h-full p-4 font-mono text-sm bg-background border-0 resize-none focus:outline-none focus:ring-0"
          placeholder="Enter your Appwrite configuration..."
          spellCheck={false}
        />
      </div>
    </div>
  )
}
