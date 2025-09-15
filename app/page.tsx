"use client"

import { useState } from "react"
import { JsonEditor } from "@/components/json-editor"
import { MermaidViewer } from "@/components/mermaid-viewer"
import { ThemeToggle } from "@/components/theme-toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Eye, Pencil } from "lucide-react"

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
  const [mobilePanel, setMobilePanel] = useState<"editor" | "viewer">("viewer")

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-background px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-8 h-8 dark:invert"
            />
            <h1 className={`font-bold text-lg sm:hidden`}>
              ASV
            </h1>
            <h1 className={`font-bold text-2xl hidden sm:inline`}>
              Appwrite Schema Viewer
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ToggleGroup
              className="sm:hidden"
              type="single"
              value={mobilePanel}
              onValueChange={(value) => value && setMobilePanel(value as "editor" | "viewer")}
              variant="outline"
              size="sm"
              aria-label="Switch between JSON Editor and Schema Viewer"
            >
              <ToggleGroupItem value="editor" aria-label="Show JSON Editor">
                <Pencil className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Editor</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="viewer" aria-label="Show Schema Viewer">
                <Eye className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Viewer</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden w-full transition-all duration-300 ease-in-out">
        <div className={`${mobilePanel === "editor" ? "block" : "hidden"} w-full sm:block sm:w-1/2 h-full animate-fade-in border-r`}>
          <JsonEditor value={jsonConfig} onChange={setJsonConfig} />
        </div>
        <div className={`${mobilePanel === "viewer" ? "block" : "hidden"} w-full sm:block sm:w-1/2 h-full overflow-auto animate-fade-in`}>
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
