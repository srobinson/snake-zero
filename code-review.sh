#!/bin/bash

# Set the GitHub repository details
GITHUB_USER="srobinson"
REPO_NAME="snake-zero"
BRANCH="main" # Change this if you're using a different branch

# Base URL for GitHub
GITHUB_BASE_URL="https://github.com/$GITHUB_USER/$REPO_NAME/blob/$BRANCH"

# Directory to scan
SRC_DIR="./src"

# Ensure the src directory exists
if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Directory '$SRC_DIR' does not exist."
  exit 1
fi

# Find all files in the src directory and generate GitHub URLs
find "$SRC_DIR" -type f | sort | sed "s|^./|$GITHUB_BASE_URL/|" > .github_url

echo "GitHub URLs saved to github_urls.txt"
