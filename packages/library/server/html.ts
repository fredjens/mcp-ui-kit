export function generateHtml(name: string, bundledJS: string, props: Record<string, unknown>): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
</head>
<body>
  <div id="root"></div>
  <script id="mcp-initial-data" type="application/json">${JSON.stringify(props)}</script>
  <script>
${bundledJS}
  </script>
</body>
</html>`;
}