"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  PenTool, 
  Square, 
  Circle, 
  Type, 
  ArrowRight, 
  Minus, 
  Eraser,
  Palette,
  Save,
  Undo,
  Redo,
  Trash2,
  Download,
  Users
} from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'

type DrawingTool = 'pen' | 'rectangle' | 'circle' | 'line' | 'text' | 'arrow' | 'eraser'
type CursorPosition = { x: number; y: number; userId: string; userName: string; color: string }

interface WhiteboardProps {
  projectId: string
  userId: string
  userName: string
}

export function Whiteboard({ projectId, userId, userName }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<DrawingTool>('pen')
  const [color, setColor] = useState('#3b82f6') // Blue-600
  const [lineWidth, setLineWidth] = useState(3)
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [redoStack, setRedoStack] = useState<ImageData[]>([])
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([])
  
  const { sendMessage, lastMessage } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
  )

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Save initial state
      saveToUndo()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Load saved whiteboard data
    loadWhiteboardData()

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [projectId])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data)
      
      switch (message.type) {
        case 'WHITEBOARD_DRAW':
          drawRemote(message.data)
          break
          
        case 'WHITEBOARD_CLEAR':
          clearCanvas()
          break
          
        case 'WHITEBOARD_CURSOR':
          updateCursorPositions(message.data)
          break
          
        case 'WHITEBOARD_LOAD':
          loadDrawing(message.data)
          break
      }
    }
  }, [lastMessage])

  const getCanvasContext = () => {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('Canvas not found')
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not found')
    
    return { canvas, ctx }
  }

  const saveToUndo = () => {
    const { canvas, ctx } = getCanvasContext()
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack(prev => [...prev, imageData])
    setRedoStack([]) // Clear redo stack when new action is performed
  }

  const undo = () => {
    if (undoStack.length < 2) return // Keep at least initial state
    
    const { canvas, ctx } = getCanvasContext()
    const currentImage = undoStack[undoStack.length - 1]
    const previousImage = undoStack[undoStack.length - 2]
    
    setRedoStack(prev => [...prev, currentImage])
    setUndoStack(prev => prev.slice(0, -1))
    
    ctx.putImageData(previousImage, 0, 0)
    broadcastDrawing()
  }

  const redo = () => {
    if (redoStack.length === 0) return
    
    const { canvas, ctx } = getCanvasContext()
    const nextImage = redoStack[redoStack.length - 1]
    
    setUndoStack(prev => [...prev, nextImage])
    setRedoStack(prev => prev.slice(0, -1))
    
    ctx.putImageData(nextImage, 0, 0)
    broadcastDrawing()
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { canvas, ctx } = getCanvasContext()
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDrawing(true)
    saveToUndo()
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    
    // Send cursor position
    sendCursorPosition(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const { canvas, ctx } = getCanvasContext()
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    switch (tool) {
      case 'pen':
      case 'eraser':
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
        ctx.lineTo(x, y)
        ctx.stroke()
        break
        
      case 'line':
        // For line, we need to redraw from start
        break
        
      default:
        ctx.lineTo(x, y)
        ctx.stroke()
    }
    
    // Send cursor position
    sendCursorPosition(x, y)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    
    const { ctx } = getCanvasContext()
    ctx.closePath()
    setIsDrawing(false)
    
    // Broadcast the drawing to other users
    broadcastDrawing()
  }

  const broadcastDrawing = () => {
    const { canvas } = getCanvasContext()
    const imageData = canvas.toDataURL('image/png')
    
    sendMessage({
      type: 'WHITEBOARD_DRAW',
      data: {
        projectId,
        userId,
        imageData,
        tool,
        color,
        lineWidth
      }
    })
  }

  const sendCursorPosition = (x: number, y: number) => {
    sendMessage({
      type: 'WHITEBOARD_CURSOR',
      data: {
        projectId,
        userId,
        userName,
        x,
        y,
        color
      }
    })
  }

  const updateCursorPositions = (data: CursorPosition) => {
    if (data.userId === userId) return
    
    setCursorPositions(prev => {
      const filtered = prev.filter(p => p.userId !== data.userId)
      return [...filtered, data]
    })
    
    // Remove cursor after 2 seconds of inactivity
    setTimeout(() => {
      setCursorPositions(prev => prev.filter(p => p.userId !== data.userId))
    }, 2000)
  }

  const drawRemote = (data: any) => {
    const { ctx } = getCanvasContext()
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
    }
    img.src = data.imageData
  }

  const loadDrawing = (imageData: string) => {
    const { ctx } = getCanvasContext()
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
    }
    img.src = imageData
  }

  const loadWhiteboardData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/whiteboard`)
      if (response.ok) {
        const data = await response.json()
        if (data.imageData) {
          loadDrawing(data.imageData)
        }
      }
    } catch (error) {
      console.error('Error loading whiteboard:', error)
    }
  }

  const saveWhiteboard = async () => {
    try {
      const { canvas } = getCanvasContext()
      const imageData = canvas.toDataURL('image/png')
      
      const response = await fetch(`/api/projects/${projectId}/whiteboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      })
      
      if (response.ok) {
        alert('Whiteboard sauvegardé!')
      }
    } catch (error) {
      console.error('Error saving whiteboard:', error)
    }
  }

  const clearCanvas = () => {
    const { canvas, ctx } = getCanvasContext()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveToUndo()
    broadcastDrawing()
  }

  const downloadCanvas = () => {
    const { canvas } = getCanvasContext()
    const link = document.createElement('a')
    link.download = `whiteboard-${projectId}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const colorOptions = [
    '#3b82f6', // Blue-600
    '#ef4444', // Red-500
    '#10b981', // Green-500
    '#f59e0b', // Amber-500
    '#8b5cf6', // Violet-500
    '#ec4899', // Pink-500
    '#000000', // Black
    '#ffffff'  // White
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PenTool className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Tableau blanc collaboratif</CardTitle>
              <p className="text-sm text-slate-600">
                Dessinez et collaborez en temps réel
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Users className="h-4 w-4" />
              {cursorPositions.length + 1} en ligne
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <ToggleGroup 
              type="single" 
              value={tool} 
              onValueChange={(v) => setTool(v as DrawingTool)}
              className="flex-wrap"
            >
              <ToggleGroupItem value="pen" aria-label="Pen">
                <PenTool className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="rectangle" aria-label="Rectangle">
                <Square className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="circle" aria-label="Circle">
                <Circle className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="Line">
                <Minus className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="arrow" aria-label="Arrow">
                <ArrowRight className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="text" aria-label="Text">
                <Type className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="eraser" aria-label="Eraser">
                <Eraser className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            <div className="h-6 w-px bg-slate-300" />
            
            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div 
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-3">
                  <Label>Couleur</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded-full border-2 ${
                          color === c ? 'border-blue-500' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="h-6 w-px bg-slate-300" />
            
            {/* Line Width */}
            <div className="flex items-center gap-3">
              <Label className="text-sm whitespace-nowrap">Épaisseur:</Label>
              <Slider
                value={[lineWidth]}
                onValueChange={([value]) => setLineWidth(value)}
                min={1}
                max={20}
                step={1}
                className="w-24"
              />
              <span className="text-sm text-slate-600 w-6">{lineWidth}px</span>
            </div>
            
            <div className="h-6 w-px bg-slate-300" />
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length < 2}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.length === 0}>
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={saveWhiteboard}>
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCanvas}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Canvas */}
          <div className="relative border rounded-lg bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-[500px] cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            
            {/* Remote cursors */}
            {cursorPositions.map((cursor, index) => (
              <div
                key={index}
                className="absolute pointer-events-none"
                style={{
                  left: cursor.x - 10,
                  top: cursor.y - 10,
                  zIndex: 50
                }}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="h-5 w-5 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: cursor.color }}
                  />
                  <div className="text-xs bg-slate-800 text-white px-2 py-1 rounded mt-1 whitespace-nowrap">
                    {cursor.userName}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="text-sm text-slate-600">
            <p>💡 <strong>Conseils:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Sélectionnez un outil dans la barre d'outils</li>
              <li>Cliquez et glissez pour dessiner</li>
              <li>Utilisez Ctrl+Z pour annuler / Ctrl+Y pour rétablir</li>
              <li>Les autres utilisateurs voient vos modifications en temps réel</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}