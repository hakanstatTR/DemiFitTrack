# DEMI_FIT_TRACK Web

Black & green fitness tracker — works on iPhone Safari and Android Chrome.

## Live site

After GitHub Pages is enabled, your app will be at:

**https://YOUR_GITHUB_USERNAME.github.io/DEMI_FIT_TRACK/**

Replace `YOUR_GITHUB_USERNAME` with your GitHub account name.

## Features

- Workout log (strength + walking/running with tempo)
- Meal search with quantity
- History & progress
- Black/green theme + startup sound (tap to start on iPhone)

Data is stored in the browser (localStorage).

## Local run

```powershell
cd C:\Users\User\FitTrack\DEMI_FIT_TRACK
py -m http.server 8080
```

Open: http://localhost:8080

## GitHub setup (one time)

```powershell
gh auth login
cd C:\Users\User\FitTrack\DEMI_FIT_TRACK
git init -b main
git add .
git commit -m "Initial DEMI_FIT_TRACK web app"
gh repo create DEMI_FIT_TRACK --public --source=. --remote=origin --push
```

Then in GitHub: **Settings → Pages → Source: GitHub Actions** (workflow included).

Your public link: `https://USERNAME.github.io/DEMI_FIT_TRACK/`
