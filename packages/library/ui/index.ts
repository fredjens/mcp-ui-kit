
/**
 * Send a prompt to the parent window
 */
export function sendPrompt(message: string) {
    window.parent.postMessage({
        type: 'message',
        payload: {
            message: message
        }
    }, '*');
}

/**
 * Call a tool
 */
export function callTool(toolName: string, params: Record<string, unknown> = {}) {
    window.parent.postMessage({
        type: 'tool',
        payload: {
            toolName: toolName,
            params: params
        }
    }, '*');
}

/**
 * Use MCP props
 */
export function useProps<T>(defaults: T): T {
    // In a real implementation, this would read from:
    // window.__MCP_INITIAL_DATA__ or similar injection point
    const scriptTag = document.getElementById('mcp-initial-data');
    if (scriptTag?.textContent) {
        try {
            console.log('scriptTag.textContent', scriptTag.textContent);
            return { ...defaults, ...JSON.parse(scriptTag.textContent) };
        } catch {
            return defaults;
        }
    }
    return defaults;
}