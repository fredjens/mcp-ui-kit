import { useEffect, useRef, type RefObject } from 'react';

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
 * Request the parent to resize the iframe to fit content
 * Call this after your content has rendered
 */
export function resizeToContent(element?: HTMLElement) {
    const target = element || document.body;

    // Use scrollHeight/scrollWidth for full content size (not just visible area)
    // Also account for any margin on the element
    const style = window.getComputedStyle(target);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;

    // For body, also account for body padding/margin
    let extraHeight = 0;
    let extraWidth = 0;
    if (target !== document.body) {
        const bodyStyle = window.getComputedStyle(document.body);
        extraHeight = (parseFloat(bodyStyle.paddingTop) || 0) + (parseFloat(bodyStyle.paddingBottom) || 0);
        extraWidth = (parseFloat(bodyStyle.paddingLeft) || 0) + (parseFloat(bodyStyle.paddingRight) || 0);
    }

    const width = Math.ceil(target.scrollWidth + marginLeft + marginRight + extraWidth);
    const height = Math.ceil(target.scrollHeight + marginTop + marginBottom + extraHeight);

    window.parent.postMessage({
        type: 'resize',
        payload: { width, height }
    }, '*');
}

/**
 * Hook that automatically notifies parent when content size changes
 * Returns a ref to attach to your container element
 */
export function useResizeToContent<T extends HTMLElement = HTMLDivElement>(): RefObject<T | null> {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new ResizeObserver(() => {
            resizeToContent(element);
        });

        observer.observe(element);
        // Initial resize
        resizeToContent(element);

        return () => observer.disconnect();
    }, []);

    return ref;
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