#!/bin/bash
# Phát hành: build → chép vào repo → nâng số phiên bản (workflow, README, versionCode Android) → commit → push (CI tự build APK + tạo Release)
#   ./release.sh 4.2 "v4.2: mô tả"        (chạy sau khi: node test/gate.mjs đã ĐẠT)
set -e
V="$1"; MSG="$2"; [ -z "$V" ] || [ -z "$MSG" ] && { echo "usage: release.sh <version> <commit message>"; exit 1; }
LTM=/home/claude/ltm; REPO=/home/claude/co-bay
cd $LTM && echo "$V" > VERSION && node build.mjs
cp dist/index.html $REPO/www/index.html; cp dist/index.html $REPO/web/index.html
mkdir -p $REPO/tests && cp test/*.mjs $REPO/tests/ && cp release.sh build.mjs $REPO/tests/ 2>/dev/null || true
cd $REPO
PREV=$(grep -o 'ltm-v[0-9.]*' .github/workflows/build-android.yml | head -1 | sed 's/ltm-v//')
sed -i "s/v$PREV/v$V/g" .github/workflows/build-android.yml README.md
CODE=$(echo "$V" | tr -d .)
sed -i "s/versionCode [0-9]*/versionCode $CODE/; s/versionName \"[^\"]*\"/versionName \"$V\"/" android/app/build.gradle
git add -A
git commit -q -m "$MSG

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011dXpbbj7myjXTyBRigucVQ"
git -c push.negotiate=true push -q origin loan-the-meme
git log --oneline | head -1
