import { useEffect, useState, useRef, useCallback } from 'react'
import { Monitor, FileText, AlertTriangle, Maximize2, Minimize2, RotateCw, Radio, Trash2, Timer, Package } from 'lucide-react'
import { Button } from './Button'
import type { ToolResult } from '../App'
import './ResultsPane.css'

interface ResultsPaneProps {
  result: ToolResult | null
  isExecuting: boolean
  onReload?: () => void
}

type Tab = 'ui' | 'text' | 'events'

interface IframeEvent {
  id: number
  timestamp: Date
  type: string
  payload: unknown
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}b`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`
  return `${(bytes / (1024 * 1024)).toFixed(1)}mb`
}

export function ResultsPane({ result, isExecuting, onReload }: ResultsPaneProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ui')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [events, setEvents] = useState<IframeEvent[]>([])
  const eventIdRef = useRef(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const hasUI = result?.htmlContent != null
  const hasText = result?.textContent != null

  // Clear events when result changes (new tool execution)
  useEffect(() => {
    setEvents([])
    eventIdRef.current = 0
  }, [result])

  // Listen to postMessage events from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only capture messages from our iframe
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
        const newEvent: IframeEvent = {
          id: ++eventIdRef.current,
          timestamp: new Date(),
          type: event.data?.type || 'unknown',
          payload: event.data?.payload || event.data
        }
        setEvents(prev => [...prev, newEvent])
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
    eventIdRef.current = 0
  }, [])

  useEffect(() => {
    if (hasUI) {
      setActiveTab('ui')
    } else if (hasText) {
      setActiveTab('text')
    }
  }, [hasText, hasUI])

  return (
    <div className={`results-pane ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="panel-header">
        <div className="results-tabs">
          <button
            className={`tab ${activeTab === 'ui' ? 'active' : ''}`}
            onClick={() => setActiveTab('ui')}
          >
            <Monitor size={14} />
            UI
            <span className={`tab-badge ${hasUI ? 'active' : ''}`} />
          </button>
          <button
            className={`tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <FileText size={14} />
            Text
            <span className={`tab-badge ${hasText ? 'active' : ''}`} />
          </button>
          <button
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
            {events.length > 0 && <span className="tab-count">{events.length}</span>}
          </button>
          {/*           {activeTab === 'events' && events.length > 0 && (
            <Button
              variant="ghost"
              onClick={clearEvents}
              title="Clear events"
              children="Clear events"
            />
          )} */}
        </div>

        <div className="results-actions">
          {result && !result.isError && (
            <div className="metrics">
              <span className="metric" title="Execution time">
                <Timer size={12} />
                {result.executionTime}ms
              </span>
              {result.bundleSize && (
                <span className="metric" title="Bundle size">
                  <Package size={12} />
                  {formatBytes(result.bundleSize)}
                </span>
              )}
            </div>
          )}
          {onReload && (
            <Button
              variant="ghost"
              onClick={onReload}
              disabled={isExecuting}
              title="Reload"
              icon={<RotateCw size={14} />}
            />
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
              ref={iframeRef}
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
        ) : activeTab === 'text' ? (
          <div className="text-output">
            <pre>{result.textContent || 'No text content'}</pre>
          </div>
        ) : (
          <div className="events-panel">
            {events.length === 0 ? (
              <div className="events-empty">
                <Radio size={32} strokeWidth={1} />
                <p>No events yet</p>
                <span>Events from the UI (sendPrompt, callTool, resize) will appear here</span>
              </div>
            ) : (
              <div className="events-list">
                {events.map(event => (
                  <div key={event.id} className={`event-item event-${event.type}`}>
                    <div className="event-header">
                      <span className="event-type">{event.type}</span>
                      <span className="event-time">
                        {event.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}.{event.timestamp.getMilliseconds().toString().padStart(3, '0')}
                      </span>
                    </div>
                    <pre className="event-payload">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
