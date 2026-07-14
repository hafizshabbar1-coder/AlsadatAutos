# Zero-Dependency PowerShell Web Server for AL-SADAT AUTO POS
# Uses built-in Windows .NET framework HttpListener

$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "   AL-SADAT AUTO - LOCAL WEB SERVER STARTED SUCCESSFUL   " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " Running on: http://localhost:$port/" -ForegroundColor Cyan
    Write-Host " Press [Ctrl + C] in this window to stop the server." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------"
    
    # Launch browser automatically
    Start-Process "http://localhost:$port/"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Parse URL Path
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { 
            $urlPath = "/index.html" 
        }
        
        # Translate to local file path
        $relativePath = $urlPath.TrimStart('/')
        $filePath = [System.IO.Path]::Combine($PSScriptRoot, $relativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
        
        if (Test-Path $filePath -PathType Leaf) {
            # Determine content MIME type
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "application/octet-stream"
            if ($ext -eq ".html" -or $ext -eq ".htm") { $contentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
            elseif ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
            elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
            elseif ($ext -eq ".ico") { $contentType = "image/x-icon" }
            elseif ($ext -eq ".json") { $contentType = "application/json; charset=utf-8" }
            
            # Read and write file bytes
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "200 OK  : $urlPath" -ForegroundColor Gray
        } else {
            # File Not Found
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found: $urlPath")
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            Write-Host "404 ERR : $urlPath" -ForegroundColor Red
        }
        $response.Close()
    }
} catch {
    Write-Host "Error starting web server: $_" -ForegroundColor Red
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
}
