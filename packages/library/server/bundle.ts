// Cache bundled JS per entry path (only used in production)
const bundleCache = new Map<string, string>();

// In development mode, skip cache to allow hot-reloading of component changes
const isDev = process.env.NODE_ENV !== 'production';

// Dynamic esbuild loader - tries native first, falls back to wasm for serverless
let esbuildModule: typeof import('esbuild') | null = null;
let wasmInitialized = false;

async function getEsbuild(): Promise<typeof import('esbuild')> {
    if (esbuildModule) return esbuildModule;

    // Try native esbuild first (faster, works locally)
    try {
        esbuildModule = await import('esbuild');
        // Test if native binary works
        await esbuildModule.transform('', { loader: 'js' });
        return esbuildModule;
    } catch {
        // Fall back to wasm (works on serverless without native binaries)
        const wasm = await import('esbuild-wasm');
        if (!wasmInitialized) {
            await wasm.initialize({
                wasmURL: `https://unpkg.com/esbuild-wasm@${wasm.version}/esbuild.wasm`,
            });
            wasmInitialized = true;
        }
        esbuildModule = wasm as typeof import('esbuild');
        return esbuildModule;
    }
}

async function runBuild(entryPath: string): Promise<import('esbuild').BuildResult<{ write: false }>> {
    const esbuild = await getEsbuild();
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

    let result: import('esbuild').BuildResult<{ write: false }>;

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
            const esbuild = await getEsbuild();
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