#!/usr/bin/env bash
#
# Move the markdown files in the viewer's output folder to a backup folder.
# example.md and any file named with -k/--keep (or KEEP_FILES) stay where they
# are. A file that changed in the last DAYS days also stays where it is.
#
# Usage:
#   backup-docs.sh [-d|--days DAYS] [-k|--keep NAME]... [-n|--dry-run] [-h|--help]
#
# Options:
#   -d, --days DAYS  only move files not modified in the last DAYS days
#                    (default: 7). Use 0 to move every file.
#   -k, --keep NAME  keep this file name in the output folder (repeatable)
#   -n, --dry-run    show what would move, change nothing
#
# Environment (optional):
#   SRC_DIR     folder to move files from (default: ./output next to this script)
#   DEST_DIR    folder to move files to    (default: $HOME/markdown-backup)
#   KEEP_FILES  space-separated file names to keep, in addition to example.md
#
# A file is never overwritten. If the same name exists in DEST_DIR, the file is
# skipped and stays in SRC_DIR.

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SRC_DIR:-$script_dir/output}"
DEST_DIR="${DEST_DIR:-$HOME/markdown-backup}"

# Files that stay in SRC_DIR.
EXCLUDES=(example.md)
if [[ -n "${KEEP_FILES:-}" ]]; then
    read -r -a extra_keep <<< "$KEEP_FILES"
    EXCLUDES+=("${extra_keep[@]}")
fi

DAYS=7
dry_run=false

usage() {
    sed -n '3,23p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -n|--dry-run) dry_run=true ;;
        -d|--days)
            if [[ $# -lt 2 ]]; then
                echo "Option $1 needs a number of days" >&2; usage >&2; exit 2
            fi
            DAYS="$2"
            shift
            ;;
        --days=*) DAYS="${1#--days=}" ;;
        -k|--keep)
            if [[ $# -lt 2 ]]; then
                echo "Option $1 needs a file name" >&2; usage >&2; exit 2
            fi
            EXCLUDES+=("$2")
            shift
            ;;
        --keep=*) EXCLUDES+=("${1#--keep=}") ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
done

if [[ ! "$DAYS" =~ ^[0-9]+$ ]]; then
    echo "DAYS must be a whole number of 0 or more, got: $DAYS" >&2
    exit 2
fi
cutoff=$(( $(date +%s) - DAYS * 86400 ))

# Modification time in epoch seconds. GNU stat (Linux) uses -c, BSD stat (macOS) uses -f.
mtime() {
    stat -c %Y -- "$1" 2>/dev/null || stat -f %m -- "$1"
}

is_excluded() {
    local name="$1" excluded
    for excluded in "${EXCLUDES[@]}"; do
        [[ "$name" == "$excluded" ]] && return 0
    done
    return 1
}

if [[ ! -d "$SRC_DIR" ]]; then
    echo "Source folder not found: $SRC_DIR" >&2
    exit 1
fi

moved=0
kept=0
recent=0
skipped=0

shopt -s nullglob
files=("$SRC_DIR"/*.md)
shopt -u nullglob

if [[ ${#files[@]} -eq 0 ]]; then
    echo "No .md files in $SRC_DIR"
    exit 0
fi

if [[ "$dry_run" == false ]]; then
    mkdir -p "$DEST_DIR"
fi

for file in "${files[@]}"; do
    name="$(basename "$file")"

    if is_excluded "$name"; then
        echo "keep    $name (excluded)"
        kept=$((kept + 1))
        continue
    fi

    if (( $(mtime "$file") > cutoff )); then
        echo "recent  $name (changed in the last $DAYS day(s))"
        recent=$((recent + 1))
        continue
    fi

    if [[ -e "$DEST_DIR/$name" ]]; then
        echo "skip    $name (already in $DEST_DIR)"
        skipped=$((skipped + 1))
        continue
    fi

    if [[ "$dry_run" == true ]]; then
        echo "would move  $name"
    else
        mv -n -- "$file" "$DEST_DIR/$name"
        echo "moved   $name"
    fi
    moved=$((moved + 1))
done

verb="Moved"
[[ "$dry_run" == true ]] && verb="Would move"
echo "$verb $moved file(s) to $DEST_DIR. Kept $kept (excluded), $recent (changed in the last $DAYS day(s)). Skipped $skipped (already in destination)."
