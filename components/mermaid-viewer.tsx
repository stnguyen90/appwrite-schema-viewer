"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Download, Code, Eye, ZoomIn, ZoomOut, Database } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MermaidViewerProps {
  jsonConfig: string
  viewMode: "diagram" | "source"
  setViewMode: (mode: "diagram" | "source") => void
}

interface Database {
  $id: string;
  name: string;
  enabled: boolean;
}

export function MermaidViewer({ jsonConfig, viewMode, setViewMode }: MermaidViewerProps) {
  const { theme } = useTheme()
  const [mermaidSource, setMermaidSource] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [databases, setDatabases] = useState<Database[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const diagramRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
    if (contentRef.current) {
      contentRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return

    const dx = e.clientX - lastPosition.current.x
    const dy = e.clientY - lastPosition.current.y

    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }))

    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (contentRef.current) {
      contentRef.current.style.cursor = 'grab'
    }
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Add event listener for mouse up outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp()
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  const generateMermaidFromJson = (jsonString: string, selectedDbId: string | null): string => {
    try {
      const config = JSON.parse(jsonString)
      let mermaid = "erDiagram\n"

      if (config.tables && Array.isArray(config.tables)) {
        // Filter tables by selected database
        const filteredTables = selectedDbId
          ? config.tables.filter((table: any) => table.databaseId === selectedDbId)
          : []

        // First, create all entities
        filteredTables.forEach((table: any) => {
          const entityName = table.name.replace(/\s+/g, '')
          mermaid += `    ${entityName} {\n`

          if (table.columns && Array.isArray(table.columns)) {
            // Add ID field that's always present in Appwrite
            mermaid += `        string id "system"\n`

            // Add Appwrite system fields
            mermaid += `        int sequence "system"\n`
            mermaid += `        datetime createdAt "system"\n`
            mermaid += `        datetime updatedAt "system"\n`
            mermaid += `        string[] permissions "system"\n`

            table.columns.forEach((column: any) => {
              const type = column.type
              let modifiers = []

              if (!column.required) modifiers.push("nullable")
              if (column.encrypt) modifiers.push("encrypted")

              const modifierString = modifiers.length > 0 ? ` "${modifiers.join(', ')}"` : ""
              mermaid += `        ${type}${column.array ? '[]' : ''} ${column.key}${modifierString}\n`
            })
          }

          mermaid += "    }\n"
        })

        // Then add relationships
        filteredTables.forEach((table: any) => {
          if (table.columns && Array.isArray(table.columns)) {
            table.columns.forEach((column: any) => {
              if (column.type === 'relationship' && column.relatedTable) {
                const fromEntity = table.name.replace(/\s+/g, '')
                const toEntity = filteredTables.find((t: any) => t.$id === column.relatedTable)?.name.replace(/\s+/g, '') || column.relatedTable

                // Define relationship notation based on type and array
                let notation = ''
                if (column.relationType === 'oneToOne') {
                  notation = '|o--o|'
                } else if (column.relationType === 'oneToMany') {
                  notation = '}o--o|'
                } else if (column.relationType === 'manyToOne') {
                  notation = '|o--o{'
                } else {
                  notation = '}o--o{'  // many-to-many default
                }

                // Add relationship with delete behavior and two-way indication
                const deleteAction = column.onDelete === 'cascade' ? ' (cascade)' : ''
                const twoWayIndicator = column.twoWay ? ' ↔' : ''
                const relationshipLabel = `"${column.key}${deleteAction}${twoWayIndicator}"`

                if (column.side === 'parent') {
                  mermaid += `    ${toEntity} ${notation} ${fromEntity} : ${relationshipLabel}\n`
                } else {
                  mermaid += `    ${fromEntity} ${notation} ${toEntity} : ${relationshipLabel}\n`
                }
              }
            })
          }
        })
      }

      return mermaid
    } catch (err) {
      throw new Error("Invalid JSON configuration")
    }
  }

  useEffect(() => {
    try {
      const config = JSON.parse(jsonConfig)
      if (config.tablesDB && Array.isArray(config.tablesDB)) {
        setDatabases(config.tablesDB)
        if (!selectedDatabase && config.tablesDB.length > 0) {
          setSelectedDatabase(config.tablesDB[0].$id)
        }
      }
      const source = generateMermaidFromJson(jsonConfig, selectedDatabase)
      setMermaidSource(source)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate diagram")
    }
  }, [jsonConfig, selectedDatabase])

  useEffect(() => {
    if (viewMode === "diagram" && mermaidSource && diagramRef.current && !error) {
      // Dynamically import mermaid to avoid SSR issues
      import("mermaid")
        .then((mermaid) => {
          mermaid.default.initialize({
            startOnLoad: true,
            theme: theme === "dark" ? "dark" : "default",
            securityLevel: "loose",
          })

          if (diagramRef.current) {
            diagramRef.current.innerHTML = ""
            const id = `mermaid-${Date.now()}`
            mermaid.default
              .render(id, mermaidSource)
              .then((result) => {
                if (diagramRef.current) {
                  diagramRef.current.innerHTML = result.svg
                }
              })
              .catch((err) => {
                setError("Failed to render diagram: " + err.message)
              })
          }
        })
        .catch(() => {
          setError("Failed to load Mermaid library")
        })
    }
  }, [theme, mermaidSource, viewMode, error])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidSource)
  }

  const downloadSource = () => {
    let name = 'diagram'
    if (selectedDatabase) {
      const db = databases.find(db => db.$id === selectedDatabase)
      if (db) {
        name = `${db.name} (${selectedDatabase})`
      }
    }

    if (viewMode === "diagram" && diagramRef.current) {
      const svgContent = diagramRef.current.innerHTML
      const blob = new Blob([svgContent], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${name}.svg`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const blob = new Blob([mermaidSource], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${name}.mmd`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-4 h-[45px] flex items-center bg-muted/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold sr-only">{viewMode === "diagram" ? "Entity Relationship Diagram" : "Mermaid Source"}</h2>
            {databases.length > 0 && (
              <Select
                value={selectedDatabase || undefined}
                onValueChange={setSelectedDatabase}
              >
                <SelectTrigger className="h-8 w-[200px] gap-1">
                  <Database className="w-4 h-4" />
                  <SelectValue placeholder="Select database" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.$id} value={db.$id}>
                      {db.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant={viewMode === "diagram" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("diagram")}
            >
              <Eye className="w-4 h-4 mr-2" />
              Diagram
            </Button>
            <Button
              variant={viewMode === "source" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("source")}
            >
              <Code className="w-4 h-4 mr-2" />
              Source
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={copyToClipboard} disabled={!mermaidSource}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadSource} disabled={!mermaidSource}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="p-4 text-red-500 bg-red-50 dark:bg-red-950/20 m-4 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        ) : viewMode === "source" ? (
          <pre className="p-4 font-mono text-sm bg-muted/30 h-full overflow-auto">{mermaidSource}</pre>
        ) : (
          <div
            className="relative w-full h-full overflow-hidden"
          >
            {viewMode === "diagram" && (
              <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2 items-center bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScale(prev => Math.min(4, prev + 0.1))
                    setPosition(prev => ({
                      x: prev.x - (contentRef.current?.clientWidth || 0) * 0.05,
                      y: prev.y - (contentRef.current?.clientHeight || 0) * 0.05
                    }))
                  }}
                  className="px-2"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <span className="text-xs px-1 font-mono text-center" style={{ minWidth: '48px' }}>{Math.round(scale * 100)}%</span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScale(prev => Math.max(0.1, prev - 0.1))
                    setPosition(prev => ({
                      x: prev.x + (contentRef.current?.clientWidth || 0) * 0.05,
                      y: prev.y + (contentRef.current?.clientHeight || 0) * 0.05
                    }))
                  }}
                  className="px-2"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetView}
                  className="text-xs px-2"
                >
                  Reset
                </Button>
              </div>
            )}
            <div
              ref={contentRef}
              className="absolute w-full h-full cursor-grab"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: '0 0'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div ref={diagramRef} className="p-4">
                {!mermaidSource && <p className="text-muted-foreground">Loading diagram...</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
