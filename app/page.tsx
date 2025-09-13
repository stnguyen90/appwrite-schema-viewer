"use client"

import { useState } from "react"
import { JsonEditor } from "@/components/json-editor"
import { MermaidViewer } from "@/components/mermaid-viewer"
import { ThemeToggle } from "@/components/theme-toggle"

const defaultAppwriteConfig = {
  projectId: "<PROJECT_ID>",
  endpoint: "https://<REGION>.cloud.appwrite.io/v1",
  tablesDB: [
    {
      $id: "todo",
      name: "To Do",
      enabled: true
    },
    {
      $id: "internal",
      name: "Internal",
      enabled: true
    }
  ],
  tables: [
    {
      $id: "lists",
      $permissions: [
        "create(\"any\")"
      ],
      databaseId: "todo",
      name: "Lists",
      enabled: true,
      columns: [
        {
          key: "name",
          type: "string",
          required: true,
          array: false,
          size: 255,
          default: null,
          encrypt: false
        },
        {
          key: "description",
          type: "string",
          required: false,
          array: false,
          size: 1000,
          default: null,
          encrypt: false
        }
      ],
      indexes: []
    },
    {
      $id: "tasks",
      $permissions: [
        "create(\"any\")"
      ],
      databaseId: "todo",
      name: "Tasks",
      enabled: true,
      columns: [
        {
          key: "title",
          type: "string",
          required: true,
          array: false,
          size: 255,
          default: null,
          encrypt: false
        },
        {
          key: "description",
          type: "string",
          required: false,
          array: false,
          size: 1000,
          default: null,
          encrypt: false
        },
        {
          key: "completed",
          type: "boolean",
          required: false,
          array: false,
          default: false
        },
        {
          key: "dueDate",
          type: "datetime",
          required: false,
          array: false,
          format: "",
          default: null
        },
        {
          key: "list",
          type: "relationship",
          required: false,
          array: false,
          relatedTable: "lists",
          relationType: "manyToOne",
          twoWay: false,
          twoWayKey: "tasks",
          onDelete: "cascade",
          side: "parent"
        }
      ],
      indexes: []
    },
    {
      $id: "config",
      $permissions: [
      ],
      databaseId: "internal",
      name: "Config",
      enabled: true,
      columns: [
        {
          key: "value",
          type: "string",
          required: true,
          array: false,
          size: 255,
          default: null,
          encrypt: false
        }
      ],
      indexes: []
    }
  ]
}

export default function Home() {
  const [jsonConfig, setJsonConfig] = useState(JSON.stringify(defaultAppwriteConfig, null, 2))
  const [viewMode, setViewMode] = useState<"diagram" | "source">("diagram")

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-8 h-8 dark:invert"
            />
            <h1 className="text-2xl font-bold">Appwrite Schema Viewer</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r">
          <JsonEditor value={jsonConfig} onChange={setJsonConfig} />
        </div>
        <div className="w-1/2 overflow-auto">
          <MermaidViewer 
            jsonConfig={jsonConfig} 
            viewMode={viewMode} 
            setViewMode={setViewMode}
          />
        </div>
      </div>
    </div>
  )
}
