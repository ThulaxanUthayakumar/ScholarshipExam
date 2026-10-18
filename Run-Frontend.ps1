$ErrorActionPreference = "Stop"
Push-Location (Join-Path $PSScriptRoot "frontend")
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
    npm run dev
} finally { Pop-Location }

