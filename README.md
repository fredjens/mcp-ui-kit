# MCP UI Kit

Build interactive React UIs for MCP tools.

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) enables AI assistants to interact with external tools. **mcp-ui-kit** simplifies building rich UI components that render directly in AI chat:

- **Bundling on-demand** — Write React components, bundled automatically when the tool is called
- **Zero config** — No webpack/vite setup, just `createUI()` and point to your `.tsx` file
- **Props from server** — Pass data from your MCP tool directly to React via `useProps()`
- **Two-way communication** — Components can `sendPrompt()` to the AI or `callTool()` to invoke other MCP tools

<a href="https://mcp-ui-kit-inspector.vercel.app/" target="_blank">MCP UI Inspector</a> — Built on [@mcp-ui/server](https://www.npmjs.com/package/@mcp-ui/server)

## Installation

```bash
npm install mcp-ui-kit @modelcontextprotocol/sdk
```

## Server Usage

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createUI } from 'mcp-ui-kit/server';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });

const dashboardUI = createUI('my-dashboard', import.meta.resolve('./MyComponent.tsx'));

server.registerTool(
  'dashboard',
  { description: 'Interactive dashboard', _meta: dashboardUI.meta },
  async () => ({
    content: [
      { type: 'text', text: 'Dashboard loaded' },
      await dashboardUI.component({ props: { title: 'Hello' }, frameSize: ['700px', '500px'] })
    ]
  })
);
```

### With Input Schema

```typescript
import { z } from 'zod';
import { createUI } from 'mcp-ui-kit/server';

const stockUI = createUI('stocks', import.meta.resolve('./StockDashboard.tsx'));

server.registerTool(
  'stock_portfolio',
  {
    description: 'View stock portfolio',
    _meta: stockUI.meta,
    inputSchema: {
      symbols: z.array(z.string()).default(['AAPL', 'GOOGL']),
      timeframe: z.enum(['1D', '1W', '1M', '1Y']).default('1M'),
    },
  },
  async ({ symbols, timeframe }) => ({
    content: [
      { type: 'text', text: `Showing ${symbols.join(', ')} for ${timeframe}` },
      await stockUI.component({ props: { symbols, timeframe } })
    ]
  })
);
```

## Client Usage

```tsx
import { sendPrompt, callTool, useProps } from 'mcp-ui-kit/ui';

function StockDashboard() {
  const { symbols, timeframe } = useProps({ symbols: ['AAPL'], timeframe: '1M' });

  return (
    <div>
      <h1>Stock Portfolio ({timeframe})</h1>
      {symbols.map(symbol => (
        <div key={symbol}>
          <span>{symbol}</span>
          <button onClick={() => sendPrompt(`Analyze ${symbol} over ${timeframe}`)}>Analyze</button>
          <button onClick={() => callTool('get_stock_price', { symbol })}>Refresh</button>
        </div>
      ))}
    </div>
  );
}
```

## API

### Server (`mcp-ui-kit/server`)

**`createUI(name, entryUrl)`** — Creates a UI component
- Returns `{ meta, component(opts?) }`
- `opts.props`: Data passed to your React component
- `opts.frameSize`: `[width, height]` e.g. `['700px', '500px']`

```typescript
createUI('dashboard', import.meta.resolve('./MyComponent.tsx'));  // ESM
createUI('dashboard', require.resolve('./MyComponent.tsx'));       // CommonJS
```

### UI (`mcp-ui-kit/ui`)

- **`useProps(defaults)`** — Get props passed from the server
- **`sendPrompt(message)`** — Send a message to the AI chat
- **`callTool(name, params)`** — Invoke an MCP tool

## Development

```bash
npm install
npm run dev:all  # Start demo server + inspector
```
