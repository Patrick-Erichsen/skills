#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"

mkdir -p "$TARGET_DIR"

for skill_dir in "$REPO_DIR"/*; do
    [ -d "$skill_dir" ] || continue
    [ -f "$skill_dir/SKILL.md" ] || continue

    skill_name="$(basename "$skill_dir")"
    target="$TARGET_DIR/$skill_name"

    if [ -L "$target" ]; then
        rm "$target"
    elif [ -e "$target" ]; then
        backup="$target.backup.$(date +%Y%m%d%H%M%S)"
        mv "$target" "$backup"
        echo "Backed up existing $target -> $backup"
    fi

    ln -s "$skill_dir" "$target"
    echo "Linked $target -> $skill_dir"
done
