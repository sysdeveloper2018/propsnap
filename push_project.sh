#!/bin/bash

USERNAME="sysdeveloper2018"

echo "Enter your GitHub Personal Access Token:"
read -s TOKEN

echo "Enter a name for the new GitHub repository:"
read REPO

echo "Enter the full path to your project folder:"
read PROJECT_PATH

cd "$PROJECT_PATH" || { echo "ERROR: Folder not found"; exit 1; }

# Create repo on GitHub
echo "Creating GitHub repository..."
curl -u "$USERNAME:$TOKEN" https://api.github.com/user/repos -d "{\"name\":\"$REPO\"}"

# Initialize Git
echo "Initializing local Git repo..."
git init
git add .
git commit -m "Initial commit"

# Add remote
git remote add origin https://github.com/$USERNAME/$REPO.git

# Push
git branch -M main
git push -u https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO.git main

echo "✔ Done! Your project is now uploaded to:"
echo "https://github.com/$USERNAME/$REPO"