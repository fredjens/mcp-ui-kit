import { useState } from 'react'
import { Monitor, FileText, Clock, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from './Button'
import type { ToolResult } from '../App'
import './ResultsPane.css'

interface ResultsPaneProps {
  result: ToolResult | null
  isExecuting: boolean
}

type Tab = 'ui' | 'text'

export function ResultsPane({ result, isExecuting }: ResultsPaneProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ui')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const hasUI = result?.htmlContent != null
  const hasText = result?.textContent != null

  return (
    <div className={`results-pane ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="panel-header">
        <div className="results-tabs">
          <Button
            className={`tab ${activeTab === 'ui' ? 'active' : ''}`}
            onClick={() => setActiveTab('ui')}
            icon={<Monitor size={14} />}
          >
            UI Output
            {hasUI && <span className="tab-badge">✓</span>}
          </Button>
          <Button
            className={`tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
            icon={<FileText size={14} />}
          >
            Text Response
            {hasText && <span className="tab-badge">✓</span>}
          </Button>
        </div>

        <div className="results-actions">
          {result?.timestamp && (
            <span className="timestamp">
              <Clock size={12} />
              {result.timestamp.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            icon={isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          />
        </div>
      </div>

      <div className="results-content">
        {isExecuting ? (
          <div className="results-loading">
            <div className="loader"></div>
            <p>Executing tool...</p>
          </div>
        ) : !result ? (
          <div className="results-empty">
            <Monitor size={48} strokeWidth={1} />
            <p>Execute a tool to see results</p>
          </div>
        ) : result.isError ? (
          <div className="results-error">
            <AlertTriangle size={24} />
            <p>Error</p>
            <pre>{result.textContent}</pre>
          </div>
        ) : activeTab === 'ui' ? (
          hasUI ? (
            <iframe
              className="ui-frame"
              srcDoc={result.htmlContent!}
              title="Tool UI Output"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="results-empty">
              <Monitor size={48} strokeWidth={1} />
              <p>No UI output returned</p>
              <span>This tool may only return text content</span>
            </div>
          )
        ) : (
          <div className="text-output">
            <pre>{result.textContent || 'No text content'}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
