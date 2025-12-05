import { Server, Plug, PlugZap, AlertCircle } from 'lucide-react'
import { Button } from './Button'
import './Sidebar.css'

interface SidebarProps {
  serverUrl: string
  onServerUrlChange: (url: string) => void
  isConnected: boolean
  isConnecting: boolean
  sessionId: string | null
  onConnect: () => void
  error: string | null
}

export function Sidebar({
  serverUrl,
  onServerUrlChange,
  isConnected,
  isConnecting,
  sessionId,
  onConnect,
  error
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Server size={16} />
          <span>Server Connection</span>
        </div>

        <div className="sidebar-section-content">
          <div className="form-group">
            <label htmlFor="server-url">Server URL</label>
            <input
              id="server-url"
              type="text"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              placeholder="http://localhost:3000/mcp"
              disabled={isConnected}
            />
          </div>

          <Button
            variant={isConnected ? 'default' : 'primary'}
            onClick={onConnect}
            loading={isConnecting}
            loadingText="Connecting..."
            icon={isConnected ? <PlugZap size={16} /> : <Plug size={16} />}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>

          {error && (
            <div className="error-message">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {isConnected && sessionId && (
            <div className="session-info">
              <div className="session-label">Session ID</div>
              <code className="session-id">{sessionId.slice(0, 8)}...</code>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span>About</span>
        </div>
        <div className="sidebar-section-content">
          <p className="sidebar-about">
            MCP UI Inspector is a developer tool for testing MCP servers with UI capabilities.
          </p>
          <div className="sidebar-links">
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
              MCP Documentation
            </a>
          </div>
        </div>
      </div>
    </aside>
  )
}
