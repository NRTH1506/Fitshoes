# Simple static file server for Windows PowerShell
# Serves files from the script directory on http://localhost:8080/

param(
    [int]$Port = 8081
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Prefix = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($Prefix)
try {
    $listener.Start()
} catch {
    Write-Error "Failed to start listener on $Prefix. Maybe the port is in use or you need elevated permissions. $_"
    exit 1
}

Write-Output "Serving $Root on $Prefix"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $raw = $request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($raw)) { $raw = 'index.html' }

    # protect path traversal
    $safePath = [System.IO.Path]::GetFullPath((Join-Path $Root $raw))
    if (-not $safePath.StartsWith([System.IO.Path]::GetFullPath($Root))) {
        $context.Response.StatusCode = 403
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
        $context.Response.OutputStream.Write($buffer,0,$buffer.Length)
        $context.Response.Close()
        continue
    }

    $file = Join-Path $Root $raw
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $context.Response.ContentLength64 = $bytes.Length
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        switch ($ext) {
            '.html' { $context.Response.ContentType = 'text/html' }
            '.htm' { $context.Response.ContentType = 'text/html' }
            '.css' { $context.Response.ContentType = 'text/css' }
            '.js' { $context.Response.ContentType = 'application/javascript' }
            '.json' { $context.Response.ContentType = 'application/json' }
            '.png' { $context.Response.ContentType = 'image/png' }
            '.jpg' { $context.Response.ContentType = 'image/jpeg' }
            '.jpeg' { $context.Response.ContentType = 'image/jpeg' }
            '.gif' { $context.Response.ContentType = 'image/gif' }
            '.svg' { $context.Response.ContentType = 'image/svg+xml' }
            default { $context.Response.ContentType = 'application/octet-stream' }
        }
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.OutputStream.Close()
    } else {
        $context.Response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1>")
        $context.Response.OutputStream.Write($buffer,0,$buffer.Length)
        $context.Response.Close()
    }
}

$listener.Stop()
$listener.Close()
