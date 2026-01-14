#!/bin/sh
# Docker entrypoint script for Resgrid BigBoard Web
# This script substitutes environment variables into the env-config.js file at container startup

set -e

# Define the paths
OUTPUT_FILE="/usr/share/nginx/html/env-config.js"
INDEX_HTML="/usr/share/nginx/html/index.html"

# Set default values for environment variables if not provided
export BIGBOARD_BASE_API_URL="${BIGBOARD_BASE_API_URL:-https://api.resgrid.com}"
export BIGBOARD_API_VERSION="${BIGBOARD_API_VERSION:-v4}"
export BIGBOARD_RESGRID_API_URL="${BIGBOARD_RESGRID_API_URL:-/api/v4}"
export BIGBOARD_CHANNEL_HUB_NAME="${BIGBOARD_CHANNEL_HUB_NAME:-eventingHub}"
export BIGBOARD_REALTIME_GEO_HUB_NAME="${BIGBOARD_REALTIME_GEO_HUB_NAME:-geolocationHub}"
export BIGBOARD_LOGGING_KEY="${BIGBOARD_LOGGING_KEY:-}"
export BIGBOARD_APP_KEY="${BIGBOARD_APP_KEY:-}"
export BIGBOARD_MAPBOX_PUBKEY="${BIGBOARD_MAPBOX_PUBKEY:-}"
export BIGBOARD_SENTRY_DSN="${BIGBOARD_SENTRY_DSN:-}"
export BIGBOARD_COUNTLY_APP_KEY="${BIGBOARD_COUNTLY_APP_KEY:-}"
export BIGBOARD_COUNTLY_SERVER_URL="${BIGBOARD_COUNTLY_SERVER_URL:-}"
export BIGBOARD_MAINTENANCE_MODE="${BIGBOARD_MAINTENANCE_MODE:-false}"

# Function to JSON-encode a string value for safe JS interpolation
# Escapes backslashes, double quotes, single quotes, newlines, carriage returns, and tabs
json_encode_string() {
  local value="$1"
  # Use printf and sed to escape special characters
  # Order matters: escape backslashes first, then other characters
  printf '%s' "$value" | sed \
    -e 's/\\/\\\\/g' \
    -e 's/"/\\"/g' \
    -e "s/'/\\\\'/g" \
    -e 's/\t/\\t/g' \
    -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\n/g' \
    -e 's/\r/\\r/g'
}

# Sanitize all BIGBOARD_* environment variables for safe JS string interpolation
SAFE_BASE_API_URL=$(json_encode_string "$BIGBOARD_BASE_API_URL")
SAFE_API_VERSION=$(json_encode_string "$BIGBOARD_API_VERSION")
SAFE_RESGRID_API_URL=$(json_encode_string "$BIGBOARD_RESGRID_API_URL")
SAFE_CHANNEL_HUB_NAME=$(json_encode_string "$BIGBOARD_CHANNEL_HUB_NAME")
SAFE_REALTIME_GEO_HUB_NAME=$(json_encode_string "$BIGBOARD_REALTIME_GEO_HUB_NAME")
SAFE_LOGGING_KEY=$(json_encode_string "$BIGBOARD_LOGGING_KEY")
SAFE_APP_KEY=$(json_encode_string "$BIGBOARD_APP_KEY")
SAFE_MAPBOX_PUBKEY=$(json_encode_string "$BIGBOARD_MAPBOX_PUBKEY")
SAFE_SENTRY_DSN=$(json_encode_string "$BIGBOARD_SENTRY_DSN")
SAFE_COUNTLY_APP_KEY=$(json_encode_string "$BIGBOARD_COUNTLY_APP_KEY")
SAFE_COUNTLY_SERVER_URL=$(json_encode_string "$BIGBOARD_COUNTLY_SERVER_URL")

# Normalize and validate MAINTENANCE_MODE as a boolean
# Only accept exactly "true" or "false", default to false with a warning for invalid values
case "$BIGBOARD_MAINTENANCE_MODE" in
  true)
    SAFE_MAINTENANCE_MODE="true"
    ;;
  false)
    SAFE_MAINTENANCE_MODE="false"
    ;;
  *)
    echo "WARNING: Invalid BIGBOARD_MAINTENANCE_MODE value: '$BIGBOARD_MAINTENANCE_MODE'. Expected 'true' or 'false'. Defaulting to false." >&2
    SAFE_MAINTENANCE_MODE="false"
    ;;
esac

# Create the env-config.js with sanitized values
cat > "$OUTPUT_FILE" << EOF
/**
 * Runtime Environment Configuration for Web
 * Generated at container startup time
 */
window.__ENV__ = {
  BASE_API_URL: '${SAFE_BASE_API_URL}',
  API_VERSION: '${SAFE_API_VERSION}',
  RESGRID_API_URL: '${SAFE_RESGRID_API_URL}',
  CHANNEL_HUB_NAME: '${SAFE_CHANNEL_HUB_NAME}',
  REALTIME_GEO_HUB_NAME: '${SAFE_REALTIME_GEO_HUB_NAME}',
  LOGGING_KEY: '${SAFE_LOGGING_KEY}',
  APP_KEY: '${SAFE_APP_KEY}',
  MAPBOX_PUBKEY: '${SAFE_MAPBOX_PUBKEY}',
  SENTRY_DSN: '${SAFE_SENTRY_DSN}',
  COUNTLY_APP_KEY: '${SAFE_COUNTLY_APP_KEY}',
  COUNTLY_SERVER_URL: '${SAFE_COUNTLY_SERVER_URL}',
  MAINTENANCE_MODE: ${SAFE_MAINTENANCE_MODE},
};
EOF

echo "Environment configuration generated successfully"

# Inject env-config.js script tag into index.html if not already present
if [ -f "$INDEX_HTML" ]; then
  if ! grep -q "env-config.js" "$INDEX_HTML"; then
    # Insert the script tag right after the opening <head> tag
    sed -i'' 's|<head>|<head><script src="/env-config.js"></script>|' "$INDEX_HTML"
    echo "Injected env-config.js into index.html"
  fi
fi

# Execute the original CMD (nginx)
exec "$@"
