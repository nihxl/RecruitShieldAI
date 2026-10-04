#!/bin/bash
VIOLATIONS=$(find apps/web/src/components apps/web/src/app -type f \
  ! -path "apps/web/src/components/Icon.tsx" \
  ! -path "apps/web/src/app/favicon.svg" \
  ! -path "apps/web/src/app/opengraph-image.svg" \
  -exec grep -nIE "#[0-9a-fA-F]{3,6}|\b(w|h|p|m|gap|top|left|right|bottom|text|leading|tracking|rounded|shadow)-[0-9]+px\b" /dev/null {} + 2>/dev/null)

if [ -n "$VIOLATIONS" ]; then
  echo "Design violation found: hex colors or arbitrary px values are not allowed outside theme.css"
  echo "$VIOLATIONS"
  exit 1
fi
echo "Design check passed."
exit 0
