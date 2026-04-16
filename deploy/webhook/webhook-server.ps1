# MPOS GitHub Webhook Listener (PowerShell)
# Runs as Windows service via NSSM on port 9850

$port = 9850
$secret = "ded6bb36135f4b332f5fbfed0031ea6a36b8d7b8"
$deployScript = "D:\Mohamed\mpos\ms-cashier\deploy\webhook\deploy.bat"
$logFile = "D:\Mohamed\mpos\ms-cashier\deploy\webhook\webhook.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    try { Add-Content -Path $logFile -Value $line -Encoding utf8 } catch {}
}

function Verify-Signature($payload, $signature) {
    if (-not $signature) { return $false }
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
    $hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
    $expected = "sha256=" + [BitConverter]::ToString($hash).Replace("-", "").ToLower()
    return $expected -eq $signature
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$port/")
$listener.Start()
Write-Log "Webhook server listening on port $port"

$deploying = $false

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Health check
        if ($request.HttpMethod -eq "GET" -and $request.Url.AbsolutePath -eq "/health") {
            $body = [System.Text.Encoding]::UTF8.GetBytes("OK")
            $response.StatusCode = 200
            $response.ContentType = "text/plain"
            $response.OutputStream.Write($body, 0, $body.Length)
            $response.Close()
            continue
        }

        # Webhook
        if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/webhook") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $payload = $reader.ReadToEnd()
            $reader.Close()

            $sig = $request.Headers["X-Hub-Signature-256"]
            if (-not (Verify-Signature $payload $sig)) {
                Write-Log "REJECTED: Invalid signature"
                $response.StatusCode = 401
                $response.Close()
                continue
            }

            $event = $request.Headers["X-GitHub-Event"]
            Write-Log "Event: $event"

            if ($event -eq "ping") {
                Write-Log "Ping received"
                $body = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true,"message":"pong"}')
                $response.StatusCode = 200
                $response.ContentType = "application/json"
                $response.OutputStream.Write($body, 0, $body.Length)
                $response.Close()
                continue
            }

            if ($event -ne "push") {
                $response.StatusCode = 200
                $response.Close()
                continue
            }

            $data = $payload | ConvertFrom-Json
            $branch = $data.ref -replace "refs/heads/", ""

            if ($branch -ne "main") {
                Write-Log "Ignoring branch: $branch"
                $response.StatusCode = 200
                $response.Close()
                continue
            }

            $pusher = $data.pusher.name
            $msg = $data.head_commit.message
            Write-Log "Push to main by $pusher : $msg"

            if ($deploying) {
                Write-Log "SKIPPED: Deploy in progress"
                $body = [System.Text.Encoding]::UTF8.GetBytes('{"ok":false,"message":"deploy in progress"}')
                $response.StatusCode = 202
                $response.OutputStream.Write($body, 0, $body.Length)
                $response.Close()
                continue
            }

            $body = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true,"message":"deploy started"}')
            $response.StatusCode = 200
            $response.ContentType = "application/json"
            $response.OutputStream.Write($body, 0, $body.Length)
            $response.Close()

            # Run deploy in background
            $deploying = $true
            Write-Log "Starting deploy..."
            try {
                $proc = Start-Process cmd.exe -ArgumentList "/c `"$deployScript`"" -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$logFile.deploy.out" -RedirectStandardError "$logFile.deploy.err"
                if ($proc.ExitCode -eq 0) {
                    Write-Log "DEPLOY SUCCESS"
                } else {
                    Write-Log "DEPLOY FAILED (exit code $($proc.ExitCode))"
                }
            } catch {
                Write-Log "DEPLOY ERROR: $($_.Exception.Message)"
            }
            $deploying = $false
            continue
        }

        $response.StatusCode = 404
        $response.Close()
    } catch {
        Write-Log "ERROR: $($_.Exception.Message)"
    }
}
