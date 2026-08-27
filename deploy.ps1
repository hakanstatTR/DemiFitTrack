# Publish DEMI_FIT_TRACK to GitHub Pages
# Run after: gh auth login

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\Git\bin;C:\Program Files\GitHub CLI;$env:Path"
Set-Location $PSScriptRoot

Write-Host "Checking GitHub login..."
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Run: gh auth login"
    exit 1
}

$repoName = "DEMI_FIT_TRACK"
$user = (gh api user -q .login)
Write-Host "GitHub user: $user"

$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "Creating public repo and pushing..."
    gh repo create $repoName --public --source=. --remote=origin --push
} else {
    Write-Host "Pushing to existing remote..."
    git push -u origin main
}

Write-Host ""
Write-Host "Enable GitHub Pages (GitHub Actions) if not already:"
Write-Host "  Repo -> Settings -> Pages -> Build and deployment -> GitHub Actions"
Write-Host ""
Write-Host "Your public link (after deploy, ~1-2 min):"
Write-Host "  https://$user.github.io/$repoName/"
Write-Host ""
Write-Host "Open repo:"
gh repo view --web
