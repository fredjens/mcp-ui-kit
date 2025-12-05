# MCP-UI Weather Dashboard Server

A clean example of an MCP server that provides an interactive weather dashboard UI using React and remoteDom.

## Architecture

```
┌─────────────────────────┐
│ React Component (TSX)   │
│ server/components/      │
└───────────┬─────────────┘
            │
            ▼ esbuild bundles
┌─────────────────────────┐
│ Bundle (JS)             │
│ dist/                   │
└───────────┬─────────────┘
            │
            ▼ loaded by server
┌─────────────────────────┐
│ MCP Server              │
│ Creates remoteDom       │
│ resource                │
└───────────┬─────────────┘
            │
            ▼ MCP protocol
┌─────────────────────────┐
│ Client (nanobot, etc.)  │
│ Renders in sandbox      │
│ with React provided     │
└─────────────────────────┘
```

## Setup

### Install Dependencies
```bash
npm install
```

### Build the UI Bundle
```bash
npm run build:ui
```

This bundles the React component using esbuild:
- Input: `server/components/index.tsx`
- Output: `dist/weather-dashboard.bundle.js`

### Start the Server
```bash
npm start
```

This will:
1. Build the UI bundle
2. Start the MCP server on `http://localhost:3000/mcp`

### Development with Auto-reload
```bash
npm run watch
```

Rebuilds UI and restarts server on file changes.

## How It Works

### 1. React Component (`server/components/WeatherDashboard.tsx`)
- Written in modern React with hooks, JSX, TypeScript
- Includes interactive city selection, weather data, forecast
- Uses `postMessage` to send data back to chat via MCP-UI protocol

### 2. Build Step (`build-ui.mjs`)
- Uses esbuild to bundle the React component
- Transpiles JSX → JavaScript
- Bundles imports (except React/ReactDOM which host provides)
- Output: Single IIFE bundle

### 3. Server (`server/ui.ts`)
- Reads the bundled JavaScript
- Creates a `remoteDom` UI resource with MIME type:
  `application/vnd.mcp-ui.remote-dom+javascript; framework=react`
- Server sends this to clients via MCP protocol

### 4. Client Rendering
- Client (nanobot, etc.) receives the bundle as text
- Provides React/ReactDOM in a sandboxed environment
- Executes the bundle, which renders the component
- Handles `postMessage` events from the UI

## Available Scripts

- `npm run build:ui` - Build the React UI bundle
- `npm start` - Build UI + start server
- `npm run watch` - Development mode with auto-reload
- `npm run nanobot` - Start nanobot client

## Key Files

- `server/components/WeatherDashboard.tsx` - Main React component
- `server/components/index.tsx` - Entry point for bundle
- `build-ui.mjs` - esbuild configuration
- `server/ui.ts` - Creates MCP-UI resource
- `server/index.ts` - MCP server setup
- `dist/weather-dashboard.bundle.js` - Generated bundle

## remoteDom vs rawHtml

### remoteDom (current)
- ✅ Full React with hooks, state management
- ✅ Better component architecture
- ✅ Type safety with TypeScript
- ⚠️ Requires client support for remoteDom
- ⚠️ Requires build step

### rawHtml (alternative)
- ✅ Works everywhere
- ✅ No build step needed
- ⚠️ Vanilla JS only
- ⚠️ Manual DOM manipulation

## Testing

### With Nanobot
```bash
npm run nanobot
```

Then in the nanobot chat:
```
Can you show me the weather dashboard?
```

Or directly call the tool:
```
weather_dashboard
```

### Features
The UI allows:
- Switching between cities (Oslo, San Francisco, New York)
- Viewing current weather and 5-day forecast
- Sending weather data back to chat with "Send to Chat" button

## Project Structure

```
mcp-ui/
├── server/
│   ├── components/
│   │   ├── WeatherDashboard.tsx    # React component
│   │   └── index.tsx                # Entry point
│   ├── index.ts                     # MCP server
│   └── ui.ts                        # UI resource definition
├── dist/
│   └── weather-dashboard.bundle.js  # Generated bundle
├── build-ui.mjs                     # esbuild configuration
├── nanobot.yaml                     # Nanobot configuration
├── package.json
└── README.md
```

