#!/usr/bin/env pwsh
# Script to download, execute, and delete KeysAndFingers from GitHub releases!

$ErrorActionPreference = 'Stop'

# Customizable Colors
$TitleColor = "Cyan"
$PromptColor = "Green"
$SuccessColor = "Green"
$ErrorColor = "Red"
$InfoColor = "Gray"

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "`nPlease run PowerShell as an administrator to execute this script.`n" -ForegroundColor $ErrorColor
    Write-Host "Press Enter to exit...`n" -ForegroundColor $InfoColor
    [System.Console]::ReadLine() | Out-Null
    exit
}

# Welcome Message
Write-Host "`nHi, Welcome to the KeysAndFingers Installer!`n" -ForegroundColor $TitleColor

$DownloadUrl = "https://github.com/iamovi/KeysAndFingers/releases/download/v1.1.0/KeysAndFingers-Setup-v1.1.0.exe"
$DownloadPath = "${env:USERPROFILE}\Downloads\KeysAndFingers-Setup.exe"

# Confirm download with the user (default is Y)
Write-Host "This will download and install: KeysAndFingers v1.1.0`n" -ForegroundColor $InfoColor
Write-Host "Do you want to proceed with the download? [Y/n]" -ForegroundColor $PromptColor -NoNewline
$confirm = Read-Host " "
if ($confirm -eq '' -or $confirm -eq 'Y' -or $confirm -eq 'y') {
    try {
        # Download the .exe file
        Write-Host "Downloading from $DownloadUrl...`n" -ForegroundColor $InfoColor
        curl.exe -Lo $DownloadPath $DownloadUrl

        # Execute the downloaded .exe file and capture the exit code
        Write-Host "Executing the installer...`n" -ForegroundColor $InfoColor
        $process = Start-Process -FilePath $DownloadPath -NoNewWindow -Wait -PassThru

        # Check the exit code after execution
        if ($process.ExitCode -eq 0) {
            Write-Host "Installation completed successfully!`n" -ForegroundColor $SuccessColor
        } else {
            Write-Host "Installation was canceled or failed. Exit code: $($process.ExitCode)`n" -ForegroundColor $ErrorColor
        }
    }
    catch {
        Write-Host "An error occurred: $_`n" -ForegroundColor $ErrorColor
    }
    finally {
        # Cleanup the downloaded .exe file regardless of success or failure
        Write-Host "Cleaning up the downloaded installer...`n" -ForegroundColor $InfoColor
        if (Test-Path $DownloadPath) {
            Remove-Item -Path $DownloadPath -Force
        }
    }
} else {
    Write-Host "Download canceled by user.`n" -ForegroundColor $InfoColor
    exit
}

Write-Host "Script execution completed! created by Ovi ren.`n" -ForegroundColor $TitleColor