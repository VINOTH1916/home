#!/bin/bash
# Run this script any time you add new images to the folders.
# It scans all image folders and regenerates images.json automatically.

BASE="$(dirname "$0")/images"
FOLDERS="surface portioSurface bathroom potioWall outdoor kitchen steps"

echo "{"  > images.json

count=0
total=$(echo $FOLDERS | wc -w)

for folder in $FOLDERS; do
  count=$((count+1))
  path="$BASE/$folder"
  echo -n "  \"$folder\": [" >> images.json

  first=1
  for f in "$path"/*.jpg "$path"/*.jpeg "$path"/*.png "$path"/*.webp "$path"/*.avif 2>/dev/null; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    if [ $first -eq 1 ]; then
      first=0
    else
      echo -n ", " >> images.json
    fi
    echo -n "\"$name\"" >> images.json
  done

  if [ $count -lt $total ]; then
    echo "]," >> images.json
  else
    echo "]"  >> images.json
  fi
done

echo "}" >> images.json

echo "✅ images.json updated:"
cat images.json
