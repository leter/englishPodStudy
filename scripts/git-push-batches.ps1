<#
.SYNOPSIS
  Initialize the repo and push everything to GitHub in size-limited batches,
  so the audio files don't exceed GitHub's 2 GB-per-push limit.

.EXAMPLE
  pwsh scripts/git-push-batches.ps1 -RemoteUrl https://github.com/<you>/<repo>.git

.NOTES
  - First commit: all code + text (srt/txt/pdf), excluding *.mp3
  - Then: audio committed & pushed in batches of ~BatchSizeMB each
  - Safe to re-run: it only adds what isn't committed yet.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$RemoteUrl,
  [string]$Branch = 'main',
  [int]$BatchSizeMB = 1500
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Invoke-Git {
  $cmd = $args
  Write-Host "git $($cmd -join ' ')" -ForegroundColor DarkGray
  & git @cmd
  if ($LASTEXITCODE -ne 0) { throw "git $($cmd -join ' ') failed (exit $LASTEXITCODE)" }
}

# 1. init + remote + branch
if (-not (Test-Path .git)) { Invoke-Git init }
Invoke-Git symbolic-ref HEAD "refs/heads/$Branch"
$existing = (& git remote) -split "`n"
if ($existing -contains 'origin') { Invoke-Git remote set-url origin $RemoteUrl }
else { Invoke-Git remote add origin $RemoteUrl }

# 2. first commit: everything EXCEPT audio
Write-Host "`n== Committing code + text (no audio) ==" -ForegroundColor Cyan
Invoke-Git add -A
& git reset --quiet -- '*.mp3'   # unstage any audio
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  Invoke-Git commit -m "init: code, configs and text resources (srt/txt/pdf)"
}
Invoke-Git push -u origin $Branch

# 3. audio in batches
Write-Host "`n== Committing audio in ~$BatchSizeMB MB batches ==" -ForegroundColor Cyan
$batchBytes = [int64]$BatchSizeMB * 1MB
$dirs = Get-ChildItem resource -Directory | Where-Object { $_.Name -match '^\d+$' } | Sort-Object Name

$pending = New-Object System.Collections.Generic.List[string]
$pendingBytes = [int64]0
$batchNo = 0

function Flush-Batch {
  param([System.Collections.Generic.List[string]]$Paths, [ref]$No)
  if ($Paths.Count -eq 0) { return }
  $No.Value++
  Write-Host "`n-- Batch $($No.Value): $($Paths.Count) folders --" -ForegroundColor Yellow
  foreach ($p in $Paths) { Invoke-Git add -- $p }
  & git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    Invoke-Git commit -m "audio batch $($No.Value)"
    Invoke-Git push origin $Branch
  } else {
    Write-Host "  (nothing new, already committed)" -ForegroundColor DarkGray
  }
}

foreach ($d in $dirs) {
  $mp3 = Get-ChildItem $d.FullName -Filter *.mp3 -File -ErrorAction SilentlyContinue
  if (-not $mp3) { continue }
  $size = ($mp3 | Measure-Object Length -Sum).Sum

  if ($pendingBytes -gt 0 -and ($pendingBytes + $size) -gt $batchBytes) {
    Flush-Batch -Paths $pending -No ([ref]$batchNo)
    $pending.Clear(); $pendingBytes = 0
  }

  $pending.Add(("resource/{0}/*.mp3" -f $d.Name))
  $pendingBytes += $size
}
Flush-Batch -Paths $pending -No ([ref]$batchNo)

# Final catch-all push: ensures any locally-committed-but-unpushed batch
# (e.g. after a previous timeout) gets sent.
Invoke-Git push origin $Branch

Write-Host "`nDone. Pushed code + $batchNo audio batches to $RemoteUrl" -ForegroundColor Green
