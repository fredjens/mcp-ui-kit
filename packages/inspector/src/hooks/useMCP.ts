import { useState, useCallback, useRef } from 'react'
import type { Tool } from '../App'

interface UseMCPReturn {
  isConnected: boolean
  isConnecting: boolean
  sessionId: string | null
  tools: Tool[]
  error: string | null
  connect: (serverUrl: string) => Promise<void>
  disconnect: () => void
  callTool: (toolName: string, params: Record<string, unknown>) => Promise<{
    textContent: string
    htmlContent: string | null
    isError: boolean
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
  const [tools, setTools] = useState<Tool[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const serverUrlRef = useRef<string>('')

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

      setSessionId(newSessionId)

      // Send initialized notification
      await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'mcp-session-id': newSessionId || '',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      })

      // List tools
      const toolsResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'mcp-session-id': newSessionId || '',
        },
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
      setTools([])
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setIsConnected(false)
    setSessionId(null)
    setTools([])
    setError(null)
  }, [])

  const callTool = useCallback(async (toolName: string, params: Record<string, unknown>) => {
    if (!sessionId) {
      throw new Error('Not connected')
    }

    const response = await fetch(serverUrlRef.current, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: params },
      }),
    })

    const text = await response.text()
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

    return {
      textContent,
      htmlContent,
      isError: false,
    }
  }, [sessionId])

  return {
    isConnected,
    isConnecting,
    sessionId,
    tools,
    error,
    connect,
    disconnect,
    callTool,
  }
}
