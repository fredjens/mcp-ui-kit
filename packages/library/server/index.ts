import { createUIResource, RESOURCE_URI_META_KEY, type UIResource } from "@mcp-ui/server";
import { fileURLToPath } from 'url';
import { bundleComponent } from './bundle.js';
import { generateHtml } from './html.js';

type UIComponentProps = {
    props?: Record<string, unknown>;
    frameSize?: [string, string];
}

type UIComponent = {
    meta: {
        [RESOURCE_URI_META_KEY]: `ui://${string}`;
    };
    component: (args?: UIComponentProps) => Promise<UIResource>;
}

/**
 * Create a UI component that bundles on-demand
 * @param name - Display name for the component
 * @param entryUrl - URL from import.meta.resolve() pointing to the component entry file
 */
export function createUI(name: string, entryUrl: string): UIComponent {
    const uri: `ui://${string}` = `ui://${name}`;
    // Convert file:// URL to path (handles import.meta.resolve() output)
    const entryPath = entryUrl.startsWith('file://') ? fileURLToPath(entryUrl) : entryUrl;

    return {
        meta: {
            [RESOURCE_URI_META_KEY]: uri,
        },
        component: async (args?: UIComponentProps): Promise<UIResource> => {
            const bundledJS = await bundleComponent(entryPath);
            const props = args?.props || {};
            const frameSize = args?.frameSize || ['700px', '600px'];
            const htmlContent = generateHtml(name, bundledJS, props);

            return createUIResource({
                uri,
                encoding: 'text',
                content: {
                    type: 'rawHtml',
                    htmlString: htmlContent,
                },
                uiMetadata: {
                    'preferred-frame-size': frameSize,
                    'initial-render-data': props,
                },
            });
        },
    };
}
