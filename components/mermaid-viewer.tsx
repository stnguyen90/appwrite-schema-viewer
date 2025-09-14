"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Download, Code, ZoomIn, ZoomOut, Database, LayoutDashboard } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

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

  const handleStart = (x: number, y: number) => {
    isDragging.current = true
    lastPosition.current = { x, y }
    if (contentRef.current) {
      contentRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMove = (x: number, y: number) => {
    if (!isDragging.current) return

    const dx = x - lastPosition.current.x
    const dy = y - lastPosition.current.y

    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }))

    lastPosition.current = { x, y }
  }

  const handleEnd = () => {
    isDragging.current = false
    if (contentRef.current) {
      contentRef.current.style.cursor = 'grab'
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
      // Prevent scrolling while dragging
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    handleEnd()
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
      <div className="border-b px-4 py-2 flex flex-col sm:flex-row sm:h-[45px] gap-2 sm:gap-0 items-start sm:items-center bg-muted/50">
        <div className="flex w-full justify-between sm:items-center gap-2 sm:gap-4">
          <div>
            <h2 className="font-semibold sr-only">{viewMode === "diagram" ? "Entity Relationship Diagram" : "Mermaid Source"}</h2>
            {databases.length > 0 && (
              <Select
                value={selectedDatabase || undefined}
                onValueChange={setSelectedDatabase}
              >
                <SelectTrigger className="h-8 w-full sm:w-[200px] gap-1">
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
          </div>
          <div className="flex">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "diagram" | "source")} className="h-8">
              <ToggleGroupItem value="diagram" aria-label="Show diagram view">
                <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Diagram</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="source" aria-label="Show source view">
                <Code className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Source</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={!mermaidSource} className="h-8 w-8">
              <Copy className="w-4 h-4" />
              <span className="sr-only">Copy</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={downloadSource} disabled={!mermaidSource} className="h-8 w-8">
              <Download className="w-4 h-4" />
              <span className="sr-only">Download</span>
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
              <div className="absolute right-4 bottom-4 z-10 flex flex-row sm:flex-col gap-2 items-center bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScale(prev => Math.min(4, prev + 0.2))
                    setPosition(prev => ({
                      x: prev.x - (contentRef.current?.clientWidth || 0) * 0.1,
                      y: prev.y - (contentRef.current?.clientHeight || 0) * 0.1
                    }))
                  }}
                  className="p-2 sm:px-2"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <span className="text-xs px-1 font-mono text-center" style={{ minWidth: '48px' }}>{Math.round(scale * 100)}%</span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScale(prev => Math.max(0.1, prev - 0.2))
                    setPosition(prev => ({
                      x: prev.x + (contentRef.current?.clientWidth || 0) * 0.1,
                      y: prev.y + (contentRef.current?.clientHeight || 0) * 0.1
                    }))
                  }}
                  className="p-2 sm:px-2"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetView}
                  className="text-xs p-2"
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
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
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
