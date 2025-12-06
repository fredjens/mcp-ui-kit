import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { createUI } from 'mcp-ui-kit/server';

const app = express();
const port = 3000;

app.use(cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication.
app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sid) => {
                transports[sid] = transport;
                console.log(`MCP Session initialized: ${sid}`);
            },
        });

        transport.onclose = () => {
            if (transport.sessionId) {
                console.log(`MCP Session closed: ${transport.sessionId}`);
                delete transports[transport.sessionId];
            }
        };

        const server = new McpServer({
            name: "mcp-ui-demo-server",
            version: "1.0.0"
        });

        // ============================================
        // TOOL 1: Weather Dashboard (simple, no params)
        // ============================================
        const weatherDashboardUI = createUI('weather-dashboard', import.meta.resolve('./components/index.tsx'));

        server.registerTool(
            'weather_dashboard',
            { description: 'Interactive weather dashboard showing current conditions and 5-day forecast for Oslo', _meta: weatherDashboardUI.meta },
            async () => ({
                content: [
                    {
                        type: 'text' as const,
                        text: 'Weather Dashboard loaded. Current temperature in Oslo: -2°C, Partly Cloudy.'
                    },
                    await weatherDashboardUI.component()
                ],
            })
        );

        // ============================================
        // TOOL 2: Stock Portfolio (complex with inputSchema)
        // ============================================
        const stockDashboardUI = createUI('stock-dashboard', import.meta.resolve('./components/stock-entry.tsx'));

        server.registerTool(
            'stock_portfolio',
            {
                description: 'Interactive stock portfolio dashboard. View real-time prices, charts, and analysis for your selected stocks.',
                _meta: stockDashboardUI.meta,
                inputSchema: {
                    symbols: z.array(z.string()).default(['AAPL', 'GOOGL', 'MSFT']),
                    timeframe: z.enum(['1D', '1W', '1M', '3M', '1Y']).default('1M'),
                },
            } as any,
            async (params: { symbols: string[]; timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' }) => {
                const { symbols, timeframe } = params;
                const textSummary = `Stock Portfolio Dashboard loaded.

Tracking ${symbols.length} stocks: ${symbols.join(', ')}
Timeframe: ${timeframe}

This dashboard shows real-time prices, daily changes, and sparkline charts.
Use the interactive UI to view details and request AI analysis.`;

                return {
                    content: [
                        { type: 'text' as const, text: textSummary },
                        await stockDashboardUI.component({ props: { symbols, timeframe }, frameSize: ['700px', '600px'] })
                    ],
                };
            }
        );

        // ============================================
        // TOOL 3: Regular data-only tool (no UI)
        // ============================================
        server.registerTool(
            'get_stock_price',
            {
                description: 'Get the current price of a single stock. Returns just the data, no UI.',
                inputSchema: { symbol: z.string() },
            } as any,
            async (params: { symbol: string }) => {
                const { symbol } = params;
                const price = Math.round((100 + Math.random() * 200) * 100) / 100;
                const change = Math.round((Math.random() - 0.5) * 10 * 100) / 100;

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            symbol,
                            price,
                            change,
                            changePercent: Math.round((change / price) * 10000) / 100,
                            timestamp: new Date().toISOString(),
                        }, null, 2)
                    }],
                };
            }
        );

        await server.connect(transport);
    } else {
        return res.status(400).json({
            error: { message: 'Bad Request: No valid session ID provided' },
        });
    }

    await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        return res.status(404).send('Session not found');
    }
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

app.listen(port, () => {
    console.log(`\n🚀 MCP UI Demo Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📡 MCP endpoint: http://localhost:${port}/mcp`);
    console.log(`\n📦 Available tools:`);
    console.log(`   • weather_dashboard  - Simple UI, no params`);
    console.log(`   • stock_portfolio    - Complex UI with inputSchema params`);
    console.log(`   • get_stock_price    - Data-only, no UI`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
