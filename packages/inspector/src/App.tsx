import { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { ToolsPanel } from './components/ToolsPanel'
import { ResultsPane } from './components/ResultsPane'
import { useMCP } from './hooks/useMCP'
import { Analytics } from '@vercel/analytics/react';

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
  const isLocal = window.location.hostname === 'localhost'
  const [serverUrl, setServerUrl] = useState(isLocal ? 'http://localhost:3000/mcp' : 'https://mcp-ui-kit-demo-server.vercel.app/mcp')
  const {
    isConnected,
    isConnecting,
    sessionId,
    isStateless,
    tools,
    isRefreshing,
    connect,
    disconnect,
    refreshTools,
    callTool,
    error
  } = useMCP()

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [toolResult, setToolResult] = useState<ToolResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastExecution, setLastExecution] = useState<{ toolName: string; params: Record<string, unknown> } | null>(null)

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
    setLastExecution({ toolName, params })

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

  const handleReload = useCallback(async () => {
    if (lastExecution) {
      await handleExecuteTool(lastExecution.toolName, lastExecution.params)
    }
  }, [lastExecution, handleExecuteTool])

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand" onClick={() => window.location.reload()}>
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
          isStateless={isStateless}
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
              onRefreshTools={refreshTools}
              isConnected={isConnected}
              isExecuting={isExecuting}
              isRefreshing={isRefreshing}
            />

            <ResultsPane
              result={toolResult}
              isExecuting={isExecuting}
              onReload={lastExecution ? handleReload : undefined}
            />
          </div>
        </main>
      </div>
      <Analytics />
    </div>
  )
}

export default App
