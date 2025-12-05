import { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { ToolsPanel } from './components/ToolsPanel'
import { ResultsPane } from './components/ResultsPane'
import { useMCP } from './hooks/useMCP'
import './App.css'

export type Tool = {
  name: string
  description?: string
  inputSchema?: {
    type?: string
    properties?: Record<string, {
      type?: string
      description?: string
      default?: unknown
      enum?: string[]
    }>
    required?: string[]
  }
}

export type ToolResult = {
  textContent: string
  htmlContent: string | null
  isError: boolean
  timestamp: Date
}

function App() {
  const [serverUrl, setServerUrl] = useState('http://localhost:3000/mcp')
  const { 
    isConnected, 
    isConnecting, 
    sessionId, 
    tools, 
    connect, 
    disconnect,
    callTool,
    error 
  } = useMCP()

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [toolResult, setToolResult] = useState<ToolResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleConnect = useCallback(async () => {
    if (isConnected) {
      disconnect()
      setSelectedTool(null)
      setToolResult(null)
    } else {
      await connect(serverUrl)
    }
  }, [isConnected, connect, disconnect, serverUrl])

  const handleExecuteTool = useCallback(async (toolName: string, params: Record<string, unknown>) => {
    setIsExecuting(true)
    setToolResult(null)
    
    try {
      const result = await callTool(toolName, params)
      setToolResult({
        ...result,
        timestamp: new Date()
      })
    } catch (err) {
      setToolResult({
        textContent: err instanceof Error ? err.message : 'Unknown error',
        htmlContent: null,
        isError: true,
        timestamp: new Date()
      })
    } finally {
      setIsExecuting(false)
    }
  }, [callTool])

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1>MCP UI Inspector</h1>
        </div>
        <div className="header-status">
          {isConnected ? (
            <span className="status-badge connected">
              <span className="status-dot"></span>
              Connected
            </span>
          ) : (
            <span className="status-badge disconnected">
              <span className="status-dot"></span>
              Disconnected
            </span>
          )}
        </div>
      </header>

      <div className="main-layout">
        <Sidebar
          serverUrl={serverUrl}
          onServerUrlChange={setServerUrl}
          isConnected={isConnected}
          isConnecting={isConnecting}
          sessionId={sessionId}
          onConnect={handleConnect}
          error={error}
        />

        <main className="content">
          <div className="content-panels">
            <ToolsPanel
              tools={tools}
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
              onExecuteTool={handleExecuteTool}
              isConnected={isConnected}
              isExecuting={isExecuting}
            />

            <ResultsPane
              result={toolResult}
              isExecuting={isExecuting}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
