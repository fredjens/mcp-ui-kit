import * as esbuild from 'esbuild';

// Cache bundled JS per entry path (only used in production)
const bundleCache = new Map<string, string>();

// In development mode, skip cache to allow hot-reloading of component changes
const isDev = process.env.NODE_ENV !== 'production';

async function runBuild(entryPath: string): Promise<esbuild.BuildResult<{ write: false }>> {
    return esbuild.build({
        entryPoints: [entryPath],
        bundle: true,
        write: false,  // No disk I/O - keep everything in memory
        format: 'iife',
        target: 'es2020',
        jsx: 'automatic',
        loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
        },
        minify: !isDev,
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
        // Handle esbuild service errors in serverless environments (Vercel, Lambda, etc.)
        // This happens when the serverless runtime freezes/stops the esbuild subprocess.
        const isServiceError = error instanceof Error && (
            error.message.includes('service was stopped') ||
            error.message.includes('service is no longer running') ||
            error.message.includes('The service')
        );
        if (isServiceError) {
            // Force stop the dead service, then retry - esbuild will start fresh
            await esbuild.stop();
            result = await runBuild(entryPath);
        } else {
            throw error;
        }
    }

    const bundledJS = result.outputFiles[0].text;

    // Only cache in production mode
    if (!isDev) {
        bundleCache.set(entryPath, bundledJS);
    }

    return bundledJS;
}