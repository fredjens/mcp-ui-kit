# MCP UI Kit

Build interactive React UIs for MCP tools.

## Installation

```bash
npm install mcp-ui-kit
```

## Server Usage

Create UI components that bundle on-demand:

```typescript
import { createUI } from 'mcp-ui-kit/server';

const dashboardUI = createUI('my-dashboard', import.meta.resolve('./MyComponent.tsx'));

server.registerTool('dashboard', {
  description: 'Interactive dashboard'
}, async () => ({
  content: [
    { type: 'text', text: 'Dashboard loaded' },
    await dashboardUI.component({ props: { title: 'Hello' } })
  ]
}));
```

## Client Usage

Helper functions for your React components:

```typescript
import { sendPrompt, callTool, useProps } from 'mcp-ui-kit/ui';

function MyComponent() {
  const { title } = useProps({ title: 'Default' });
  
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => sendPrompt('Analyze this data')}>
        Ask AI
      </button>
      <button onClick={() => callTool('get_data', { id: 123 })}>
        Fetch Data
      </button>
    </div>
  );
}
```

## API

### Server (`mcp-ui-kit/server`)

**`createUI(name, entryUrl)`** - Creates a UI component
- `name`: Component identifier
- `entryUrl`: Path to the component entry file
- Returns: `{ component(opts?) }` where opts: `{ props?, frameSize? }`

The `entryUrl` parameter accepts both formats:

```typescript
// ESM (recommended) - using import.meta.resolve()
// Requires "type": "module" in package.json
createUI('dashboard', import.meta.resolve('./MyComponent.tsx'));

// CommonJS - using require.resolve() or absolute paths
createUI('dashboard', require.resolve('./MyComponent.tsx'));
createUI('dashboard', path.join(__dirname, './MyComponent.tsx'));
```

### UI (`mcp-ui-kit/ui`)

- **`useProps(defaults)`** - Get props passed from the server
- **`sendPrompt(message)`** - Send a message to the AI chat
- **`callTool(name, params)`** - Invoke an MCP tool

## Development

```bash
npm install
npm run dev:all  # Start demo server + inspector
```
