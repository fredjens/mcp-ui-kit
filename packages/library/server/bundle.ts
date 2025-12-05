import * as esbuild from 'esbuild';

// Cache bundled JS per entry path
const bundleCache = new Map<string, string>();

export async function bundleComponent(entryPath: string): Promise<string> {
    if (bundleCache.has(entryPath)) {
        return bundleCache.get(entryPath)!;
    }

    const result = await esbuild.build({
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
        minify: false,
    });

    const bundledJS = result.outputFiles[0].text;
    bundleCache.set(entryPath, bundledJS);
    return bundledJS;
}