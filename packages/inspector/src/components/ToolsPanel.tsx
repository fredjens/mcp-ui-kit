import { useState, useEffect } from 'react'
import { Wrench, Play, ChevronRight, Code2, FileJson } from 'lucide-react'
import { Button } from './Button'
import type { Tool } from '../App'
import './ToolsPanel.css'

interface ToolsPanelProps {
  tools: Tool[]
  selectedTool: Tool | null
  onSelectTool: (tool: Tool | null) => void
  onExecuteTool: (toolName: string, params: Record<string, unknown>) => void
  isConnected: boolean
  isExecuting: boolean
}

export function ToolsPanel({
  tools,
  selectedTool,
  onSelectTool,
  onExecuteTool,
  isConnected,
  isExecuting
}: ToolsPanelProps) {
  const [params, setParams] = useState<Record<string, string>>({})
  const [jsonMode, setJsonMode] = useState(false)
  const [jsonInput, setJsonInput] = useState('{}')

  // Reset params when tool changes
  useEffect(() => {
    if (selectedTool) {
      const defaultParams: Record<string, string> = {}
      const props = selectedTool.inputSchema?.properties || {}

      for (const [key, value] of Object.entries(props)) {
        if (value.default !== undefined) {
          defaultParams[key] = typeof value.default === 'string'
            ? value.default
            : JSON.stringify(value.default)
        } else {
          defaultParams[key] = ''
        }
      }

      setParams(defaultParams)
      setJsonInput(JSON.stringify(defaultParams, null, 2))
    }
  }, [selectedTool])

  const handleExecute = () => {
    if (!selectedTool) return

    let finalParams: Record<string, unknown> = {}

    if (jsonMode) {
      try {
        finalParams = JSON.parse(jsonInput)
      } catch {
        alert('Invalid JSON')
        return
      }
    } else {
      const props = selectedTool.inputSchema?.properties || {}

      for (const [key, value] of Object.entries(params)) {
        if (!value && !props[key]?.default) continue

        const propType = props[key]?.type

        // Try to parse as JSON for arrays/objects
        if (value.startsWith('[') || value.startsWith('{')) {
          try {
            finalParams[key] = JSON.parse(value)
            continue
          } catch {
            // Fall through to string
          }
        }

        // Convert to appropriate type
        if (propType === 'number' || propType === 'integer') {
          finalParams[key] = Number(value)
        } else if (propType === 'boolean') {
          finalParams[key] = value === 'true'
        } else {
          finalParams[key] = value
        }
      }
    }

    onExecuteTool(selectedTool.name, finalParams)
  }

  const renderParamInput = (name: string, schema: {
    type?: string
    description?: string
    default?: unknown
    enum?: string[]
  } | undefined) => {
    if (schema?.enum) {
      return (
        <select
          value={params[name] || ''}
          onChange={(e) => setParams({ ...params, [name]: e.target.value })}
        >
          <option value="">Select...</option>
          {schema.enum.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    const isArray = schema?.type === 'array'

    return (
      <input
        type="text"
        value={params[name] || ''}
        onChange={(e) => setParams({ ...params, [name]: e.target.value })}
        placeholder={isArray ? '["item1", "item2"]' : schema?.type || 'string'}
      />
    )
  }

  return (
    <div className="tools-panel">
      <div className="panel-header">
        <Wrench size={16} />
        <span>Tools</span>
        <span className="tool-count">{tools.length}</span>
      </div>

      <div className="tools-content">
        {!isConnected ? (
          <div className="tools-empty">
            <p>Connect to a server to view available tools</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="tools-empty">
            <p>No tools available</p>
          </div>
        ) : (
          <div className="tools-layout">
            <div className="tools-list">
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  className={`tool-item ${selectedTool?.name === tool.name ? 'selected' : ''}`}
                  onClick={() => onSelectTool(tool)}
                >
                  <ChevronRight size={14} className="tool-chevron" />
                  <div className="tool-info">
                    <span className="tool-name">{tool.name}</span>
                    {tool.description && (
                      <span className="tool-description">{tool.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedTool && (
              <div className="tool-detail">
                <div className="tool-detail-header">
                  <h3>{selectedTool.name}</h3>
                  {selectedTool.description && (
                    <p>{selectedTool.description}</p>
                  )}
                </div>

                <div className="tool-params">
                  <div className="params-header">
                    <span>Parameters</span>
                    <Button
                      className="json-toggle"
                      onClick={() => setJsonMode(!jsonMode)}
                      title={jsonMode ? 'Switch to form' : 'Switch to JSON'}
                      icon={jsonMode ? <Code2 size={14} /> : <FileJson size={14} />}
                    >
                      {jsonMode ? 'Form' : 'JSON'}
                    </Button>
                  </div>

                  {jsonMode ? (
                    <textarea
                      className="json-editor"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={8}
                    />
                  ) : (
                    <div className="params-form">
                      {Object.entries(selectedTool.inputSchema?.properties || {}).map(([name, schema]) => (
                        <div key={name} className="param-field">
                          <label>
                            {name}
                            {selectedTool.inputSchema?.required?.includes(name) && (
                              <span className="required">*</span>
                            )}
                          </label>
                          {schema?.description && (
                            <span className="param-description">{schema.description}</span>
                          )}
                          {renderParamInput(name, schema)}
                        </div>
                      ))}

                      {Object.keys(selectedTool.inputSchema?.properties || {}).length === 0 && (
                        <p className="no-params">This tool has no parameters</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="tool-actions">
                  <Button
                    variant="primary"
                    onClick={handleExecute}
                    loading={isExecuting}
                    loadingText="Executing..."
                    icon={<Play size={14} />}
                  >
                    Execute Tool
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
