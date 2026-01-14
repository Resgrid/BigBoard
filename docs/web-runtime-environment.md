# Web Deployment with Runtime Environment Variables

This document describes how to deploy the Resgrid BigBoard web application with runtime environment variable injection, allowing configuration changes without rebuilding the application.

## Overview

The web version of BigBoard is built using Expo Web and can be deployed as a static site served by nginx in a Docker container. Environment variables can be injected at container startup time, enabling different configurations for different environments (staging, production, etc.) from the same build artifact.

## How It Works

1. **Build Time**: The web application is built with default/placeholder environment values baked in via `expo-constants`
2. **Runtime Injection**: When the Docker container starts, the `docker-entrypoint.sh` script generates an `env-config.js` file with the actual environment values
3. **Merging**: The application's `@env` module automatically merges build-time and runtime environment variables, with runtime values taking precedence

## Files Involved

- `public/env-config.js` - Template file for runtime environment configuration
- `scripts/docker-entrypoint.sh` - Entrypoint script that generates the runtime config
- `src/lib/env.js` - Module that merges build-time and runtime environment variables
- `types/web-env.d.ts` - TypeScript declarations for the runtime environment
- `Dockerfile` - Docker configuration for the web deployment
- `nginx.conf` - Nginx configuration for serving the static files
- `docker-compose.yml` - Example Docker Compose configuration

## Building the Web Application

```bash
# Build for production
yarn build:web

# Or using Expo directly
npx expo export -p web
```

This creates a `dist` folder with the static web assets.

## Building the Docker Image

```bash
docker build -t resgrid-bigboard-web .
```

## Running with Docker

### Using Docker directly

```bash
docker run -d \
  -p 8080:80 \
  -e BIGBOARD_BASE_API_URL=https://api.resgrid.com \
  -e BIGBOARD_API_VERSION=v4 \
  -e BIGBOARD_APP_KEY=your-app-key \
  -e BIGBOARD_MAPBOX_PUBKEY=your-mapbox-key \
  --name bigboard-web \
  resgrid-bigboard-web
```

### Using Docker Compose

```bash
docker-compose up -d
```

## Environment Variables

The following environment variables can be configured at runtime:

| Variable | Description | Default |
|----------|-------------|---------|
| `BIGBOARD_BASE_API_URL` | Base URL for the API server | `https://api.resgrid.com` |
| `BIGBOARD_API_VERSION` | API version | `v4` |
| `BIGBOARD_RESGRID_API_URL` | Resgrid API URL path | `/api/v4` |
| `BIGBOARD_CHANNEL_HUB_NAME` | SignalR eventing hub name | `eventingHub` |
| `BIGBOARD_REALTIME_GEO_HUB_NAME` | SignalR geolocation hub name | `geolocationHub` |
| `BIGBOARD_LOGGING_KEY` | Logging service key | (empty) |
| `BIGBOARD_APP_KEY` | Application authentication key | (empty) |
| `BIGBOARD_MAPBOX_PUBKEY` | Mapbox public API key | (empty) |
| `BIGBOARD_SENTRY_DSN` | Sentry DSN for error tracking | (empty) |
| `BIGBOARD_COUNTLY_APP_KEY` | Countly analytics app key | (empty) |
| `BIGBOARD_COUNTLY_SERVER_URL` | Countly server URL | (empty) |
| `BIGBOARD_MAINTENANCE_MODE` | Enable maintenance mode | `false` |

## Kubernetes Deployment

For Kubernetes deployments, you can use ConfigMaps or Secrets to manage environment variables:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bigboard-config
data:
  BIGBOARD_BASE_API_URL: "https://api.resgrid.com"
  BIGBOARD_API_VERSION: "v4"
  BIGBOARD_CHANNEL_HUB_NAME: "eventingHub"
  BIGBOARD_REALTIME_GEO_HUB_NAME: "geolocationHub"
---
apiVersion: v1
kind: Secret
metadata:
  name: bigboard-secrets
type: Opaque
stringData:
  BIGBOARD_APP_KEY: "your-secret-app-key"
  BIGBOARD_MAPBOX_PUBKEY: "your-mapbox-key"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bigboard-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bigboard-web
  template:
    metadata:
      labels:
        app: bigboard-web
    spec:
      containers:
      - name: bigboard-web
        image: resgrid-bigboard-web:latest
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: bigboard-config
        - secretRef:
            name: bigboard-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Local Development

For local web development, you don't need to use Docker. The build-time environment variables from `.env.development` will be used:

```bash
# Start the development server
yarn web

# Or using Expo directly
npx expo start --web
```

## Caching Considerations

The nginx configuration ensures that `env-config.js` and `index.html` are not cached, allowing environment changes to take effect immediately when containers are restarted. Static assets (JS bundles, CSS, images) are cached for optimal performance.

## Troubleshooting

### Environment variables not updating

1. Ensure the container was restarted after changing environment variables
2. Clear your browser cache or use incognito mode
3. Check the container logs: `docker logs bigboard-web`

### Verifying the configuration

You can verify the runtime configuration by checking the `env-config.js` file in the running container:

```bash
docker exec bigboard-web cat /usr/share/nginx/html/env-config.js
```

Or by opening your browser's developer console and typing:

```javascript
console.log(window.__ENV__)
```
