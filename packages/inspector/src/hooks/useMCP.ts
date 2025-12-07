import { useState, useCallback, useRef } from 'react'
import type { Tool } from '../App'

interface UseMCPReturn {
  isConnected: boolean
  isConnecting: boolean
  sessionId: string | null
  isStateless: boolean
  tools: Tool[]
  isRefreshing: boolean
  error: string | null
  connect: (serverUrl: string) => Promise<void>
  disconnect: () => void
  refreshTools: () => Promise<void>
  callTool: (toolName: string, params: Record<string, unknown>) => Promise<{
    textContent: string
    htmlContent: string | null
    isError: boolean
    executionTime: number
    bundleSize: number | null
  }>
}

// Parse SSE response to extract JSON data
function parseSSE(text: string): unknown {
  // Method 1: Look for "data: " prefix and extract JSON
  const dataIndex = text.indexOf('data: ')
  if (dataIndex !== -1) {
    const jsonStart = dataIndex + 6 // "data: " is 6 characters
    const jsonEnd = text.indexOf('\n', jsonStart)
    const jsonStr = jsonEnd === -1 ? text.slice(jsonStart) : text.slice(jsonStart, jsonEnd)
    try {
      return JSON.parse(jsonStr)
    } catch {
      // Fall through
    }
  }

  // Method 2: Try parsing as plain JSON
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function useMCP(): UseMCPReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isStateless, setIsStateless] = useState(false)
  const [tools, setTools] = useState<Tool[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serverUrlRef = useRef<string>('')
  const sessionIdRef = useRef<string | null>(null)

  const connect = useCallback(async (serverUrl: string) => {
    setIsConnecting(true)
    setError(null)
    serverUrlRef.current = serverUrl

    try {
      // Initialize connection
      const initResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'mcp-ui-inspector', version: '1.0.0' },
          },
        }),
      })

      const newSessionId = initResponse.headers.get('mcp-session-id')
      const initText = await initResponse.text()
      const initResult = parseSSE(initText) as { result?: unknown; error?: { message: string } }

      if (!initResult || initResult.error) {
        throw new Error(initResult?.error?.message || 'Failed to initialize')
      }

      // Track whether this is a stateless server (no session ID)
      const serverIsStateless = !newSessionId
      setSessionId(newSessionId)
      sessionIdRef.current = newSessionId
      setIsStateless(serverIsStateless)

      // Helper to build headers (only include session ID if present)
      const buildHeaders = () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        }
        if (newSessionId) {
          headers['mcp-session-id'] = newSessionId
        }
        return headers
      }

      // Send initialized notification
      await fetch(serverUrl, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      })

      // List tools
      const toolsResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {},
        }),
      })

      const toolsText = await toolsResponse.text()
      const toolsResult = parseSSE(toolsText) as { result?: { tools: Tool[] }; error?: { message: string } }

      if (toolsResult?.result?.tools) {
        setTools(toolsResult.result.tools)
      }

      setIsConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setIsConnected(false)
      setSessionId(null)
      setIsStateless(false)
      setTools([])
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setIsConnected(false)
    setSessionId(null)
    sessionIdRef.current = null
    setIsStateless(false)
    setTools([])
    setError(null)
  }, [])

  const refreshTools = useCallback(async () => {
    if (!isConnected) return

    setIsRefreshing(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      }
      if (sessionIdRef.current) {
        headers['mcp-session-id'] = sessionIdRef.current
      }

      const toolsResponse = await fetch(serverUrlRef.current, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {},
        }),
      })

      const toolsText = await toolsResponse.text()
      const toolsResult = parseSSE(toolsText) as { result?: { tools: Tool[] }; error?: { message: string } }

      if (toolsResult?.result?.tools) {
        setTools(toolsResult.result.tools)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [isConnected])

  const callTool = useCallback(async (toolName: string, params: Record<string, unknown>) => {
    if (!isConnected) {
      throw new Error('Not connected')
    }

    const startTime = performance.now()

    // Build headers - only include session ID if present (stateful server)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    }
    if (sessionId) {
      headers['mcp-session-id'] = sessionId
    }

    const response = await fetch(serverUrlRef.current, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: params },
      }),
    })

    const text = await response.text()
    const executionTime = Math.round(performance.now() - startTime)

    const result = parseSSE(text) as {
      result?: {
        content: Array<{
          type: string
          text?: string
          resource?: { text?: string }
        }>
      }
      error?: { message: string }
    }

    if (result?.error) {
      return {
        textContent: result.error.message,
        htmlContent: null,
        isError: true,
        executionTime,
        bundleSize: null,
      }
    }

    const content = result?.result?.content || []
    let textContent = ''
    let htmlContent: string | null = null

    for (const item of content) {
      if (item.type === 'text' && item.text) {
        textContent = item.text
      } else if (item.type === 'resource' && item.resource?.text) {
        htmlContent = item.resource.text
      }
    }

    // Calculate bundle size (in bytes) if there's HTML content
    const bundleSize = htmlContent ? new Blob([htmlContent]).size : null

    return {
      textContent,
      htmlContent,
      isError: false,
      executionTime,
      bundleSize,
    }
  }, [isConnected, sessionId])

  return {
    isConnected,
    isConnecting,
    sessionId,
    isStateless,
    tools,
    isRefreshing,
    error,
    connect,
    disconnect,
    refreshTools,
    callTool,
  }
}
