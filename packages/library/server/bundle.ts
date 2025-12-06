import * as esbuild from 'esbuild';

// Cache bundled JS per entry path (only used in production)
const bundleCache = new Map<string, string>();

// In development mode, skip cache to allow hot-reloading of component changes
const isDev = process.env.NODE_ENV !== 'production';

async function runBuild(entryPath: string): Promise<esbuild.BuildResult<{ write: false }>> {
    const path = await import('path');
    const fs = await import('fs');
    const entryDir = path.dirname(entryPath);
    
    // Log paths for debugging
    console.log('[mcp-ui-kit] entryPath:', entryPath);
    console.log('[mcp-ui-kit] entryDir:', entryDir);
    console.log('[mcp-ui-kit] cwd:', process.cwd());
    console.log('[mcp-ui-kit] __dirname exists:', typeof __dirname !== 'undefined');
    
    // Check what exists
    const pathsToCheck = [
        path.join(entryDir, 'node_modules'),
        path.join(entryDir, '..', 'node_modules'),
        path.join(entryDir, '..', '..', 'node_modules'),
        path.join(process.cwd(), 'node_modules'),
        '/var/task/node_modules',
        '/var/task/packages/demo-server/node_modules',
    ];
    
    for (const p of pathsToCheck) {
        const exists = fs.existsSync(p);
        console.log('[mcp-ui-kit] path exists?', p, exists);
        if (exists) {
            try {
                const contents = fs.readdirSync(p).slice(0, 10);
                console.log('[mcp-ui-kit] contents (first 10):', contents);
            } catch (e) {}
        }
    }
    
    const nodePaths = pathsToCheck.filter(p => fs.existsSync(p));
    console.log('[mcp-ui-kit] using nodePaths:', nodePaths);
    
    return esbuild.build({
        entryPoints: [entryPath],
        bundle: true,
        write: false,
        format: 'iife',
        target: 'es2020',
        jsx: 'automatic',
        loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
        },
        minify: !isDev,
        nodePaths,
    });
}

export async function bundleComponent(entryPath: string): Promise<string> {
    if (!isDev && bundleCache.has(entryPath)) {
        return bundleCache.get(entryPath)!;
    }

    let result: esbuild.BuildResult<{ write: false }>;

    try {
        result = await runBuild(entryPath);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Handle service errors in serverless environments (Vercel, Lambda, etc.)
        const isServiceError = error instanceof Error && (
            errorMessage.includes('service was stopped') ||
            errorMessage.includes('service is no longer running') ||
            errorMessage.includes('The service')
        );

        if (isServiceError) {
            await esbuild.stop();
            result = await runBuild(entryPath);
        } else {
            throw error;
        }
    }

    const bundledJS = result.outputFiles[0].text;

    if (!isDev) {
        bundleCache.set(entryPath, bundledJS);
    }

    return bundledJS;
}