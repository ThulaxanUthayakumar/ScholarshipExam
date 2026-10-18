param([switch]$CreateAdmin)
$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot
$previousEmail = $env:Bootstrap__Email
$previousPassword = $env:Bootstrap__Password
try {
    if ($CreateAdmin) {
        $env:Bootstrap__Email = Read-Host "Administrator email"
        $securePassword = Read-Host "Administrator password (10+ chars, upper/lower, number, symbol)" -AsSecureString
        $env:Bootstrap__Password = [System.Net.NetworkCredential]::new("", $securePassword).Password
    }
    dotnet restore backend/ScholarshipExam.sln
    if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed" }
    dotnet run --project backend/ScholarshipExam.Api --launch-profile http
} finally {
    $env:Bootstrap__Email = $previousEmail
    $env:Bootstrap__Password = $previousPassword
    Pop-Location
}

