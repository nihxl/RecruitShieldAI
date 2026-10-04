#!/bin/bash
if grep -rnIE "#[0-9a-fA-F]{3,6}|\b(w|h|p|m|gap|top|left|right|bottom|text|leading|tracking|rounded|shadow)-[0-9]+px\b" apps/web/src/components apps/web/src/app 2>/dev/null; then
  echo "Design violation found: hex colors or arbitrary px values are not allowed outside theme.css"
  exit 1
fi
echo "Design check passed."
exit 0
