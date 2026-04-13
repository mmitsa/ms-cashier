#!/bin/bash
# Generate PWA icons from SVG
# Requires: sips (macOS) or ImageMagick (convert)
echo "To generate icons, use an SVG-to-PNG converter:"
echo "  npx svg2png-many frontend/public/icons/icon.svg -o frontend/public/icons/ -s 192,512"
echo "  Then copy icon-512.png as icon-maskable-512.png"
