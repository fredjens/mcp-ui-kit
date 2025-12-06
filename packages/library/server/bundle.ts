import * as esbuild from 'esbuild';

// Cache bundled JS per entry path (only used in production)
const bundleCache = new Map<string, string>();

// In development mode, skip cache to allow hot-reloading of component changes
const isDev = process.env.NODE_ENV !== 'production';

async function runBuild(entryPath: string): Promise<esbuild.BuildResult<{ write: false }>> {
    // Resolve node_modules paths - check both the entry's directory and common locations
    const path = await import('path');
    const entryDir = path.dirname(entryPath);
    const nodePaths = [
        path.join(entryDir, 'node_modules'),
        path.join(entryDir, '..', 'node_modules'),
        path.join(entryDir, '..', '..', 'node_modules'),
        path.join(process.cwd(), 'node_modules'),
    ];

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