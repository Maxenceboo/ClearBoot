# Logging

ClearBoot includes a built-in configurable logging system with auto-detection for test environments.

## Quick Start

By default, logging works automatically without configuration:

- **Tests**: Silent mode (no output)
- **Production**: Info level
- **Environment variable**: Respects `LOG_LEVEL=debug|info|minimal|silent`

```typescript
import { ClearBoot } from "clearboot";

// Default: auto-configured
const server = await ClearBoot.create({});
```

## Log Levels

| Level     | Description                          | Use Case                   |
| --------- | ------------------------------------ | -------------------------- |
| `silent`  | No logs                              | Tests, CI/CD               |
| `minimal` | Startup/shutdown only                | Production (minimal noise) |
| `info`    | Important events (routes, lifecycle) | Default production         |
| `debug`   | All events including route details   | Development, debugging     |

## Configuration Options

```typescript
interface LoggerConfig {
  level?: "silent" | "minimal" | "info" | "debug";
  colors?: boolean; // Default: true
  timestamp?: boolean; // Default: false
  prefix?: string; // Default: ''
  emoji?: boolean; // Default: true (set false to strip emoji)
  transport?: (msg, level) => void;
  formatter?: (msg, level, timestamp?) => string;
}
```

## Examples

### Basic Level Control

```typescript
// Force debug mode
await ClearBoot.create({
  logger: { level: "debug" },
});

// Minimal output
await ClearBoot.create({
  logger: { level: "minimal" },
});
```

### Environment Variable

```bash
# Set via environment
LOG_LEVEL=debug node server.js
```

### Add Timestamps

```typescript
await ClearBoot.create({
  logger: {
    timestamp: true, // [2026-01-14T10:30:00.000Z] 🚀 Starting ClearBoot...
  },
});
```

### Add Prefix

```typescript
await ClearBoot.create({
  logger: {
    prefix: "[MyApp]", // [MyApp] 🚀 Starting ClearBoot...
  },
});
```

### Disable Colors

Useful for CI/CD environments that don't support ANSI codes:

```typescript
await ClearBoot.create({
  logger: {
    colors: false, // Strips all color codes
  },
});
```

### Custom Transport

Send logs to a file or external service:

```typescript
import fs from "fs";

await ClearBoot.create({
  logger: {
    level: "info",
    timestamp: true,
    transport: (message, level) => {
      fs.appendFileSync("app.log", message + "\n");
    },
  },
});
```

### Custom Formatter

Complete control over log format:

```typescript
await ClearBoot.create({
  logger: {
    formatter: (message, level, timestamp) => {
      // JSON format for log aggregators
      return JSON.stringify({
        level: level.toUpperCase(),
        message: message.replace(/\x1b\[[0-9;]*m/g, ""), // strip colors
        timestamp: timestamp?.toISOString(),
        app: "my-service",
      });
    },
  },
});
```

### Winston/Pino Integration

```typescript
import winston from "winston";

const winstonLogger = winston.createLogger({
  transports: [new winston.transports.File({ filename: "app.log" })],
});

await ClearBoot.create({
  logger: {
    transport: (message, level) => {
      winstonLogger.log(level, message);
    },
  },
});
```

## Production Best Practices

### Docker/Kubernetes

```typescript
// Disable colors in containers, use JSON for log aggregation
await ClearBoot.create({
  logger: {
    colors: false,
    timestamp: true,
    formatter: (msg, level, ts) =>
      JSON.stringify({
        level,
        message: msg,
        timestamp: ts,
      }),
  },
});
```

### Cloud Functions (AWS Lambda, Google Cloud Functions)

```typescript
// Silent in tests, minimal in production
await ClearBoot.create({
  logger: {
    level: process.env.NODE_ENV === "test" ? "silent" : "minimal",
  },
});
```

### Development

```typescript
// Debug mode with timestamps
await ClearBoot.create({
  logger: {
    level: "debug",
    timestamp: true,
    prefix: "[DEV]",
  },
});
```

## What Gets Logged?

### Minimal Level

- 🚀 Starting ClearBoot...
- 🔥 Ready on port 3000
- ⚠️ Graceful shutdown signals (SIGTERM, SIGINT)
- ✅ HTTP server closed
- ❌ Critical errors (500 errors, DI failures)
- ⚠️ Slow requests (> 1000ms)

### Info Level (includes minimal)

- ⏳ Running onModuleInit()...
- ✅ onModuleInit() completed
- 🎮 Controller names
- **HTTP Requests**: `GET /users - 200 (45ms)` with color-coded status
- 🚫 Validation failures with field details
- ⚠️ Slow request warnings

### Debug Level (includes info)

- Individual route registrations with decorators
- Route order and parameter types
- Error stack traces

## HTTP Request Logging

Automatically logs all HTTP requests at `info` level with:

- HTTP method (GET, POST, etc.)
- Request path
- Response status code (color-coded)
- Request duration in milliseconds
- **Slow request detection**: Requests taking > 1000ms are flagged with ⚠️

**Example output:**

```
GET /users - 200 (23ms)
POST /users - 201 (156ms)
GET /invalid - 404 (3ms)
⚠️  SLOW REQUEST: GET /reports - 200 (1523ms)
DELETE /users/1 - 500 (89ms)
```

**Status color codes:**

- 🟢 Green: 2xx success
- 🔵 Cyan: 3xx redirects
- 🟡 Yellow: 4xx client errors
- 🔴 Red: 5xx server errors

## Error Logging

### Validation Errors (info level)

```
🚫 Validation failed on POST /users: { "email": { "_errors": ["Invalid email"] } }
```

### Runtime Errors (minimal level)

```
❌ Error on POST /users: Cannot read property 'id' of undefined
🔥 INTERNAL ERROR: Database connection failed
```

### DI Errors (minimal level)

```
❌ DI Error: Service 'UserService' not found. Did you forget @Injectable() decorator?
```

Stack traces are logged at `debug` level for detailed troubleshooting.

## Graceful Shutdown Logging

```
⚠️  SIGTERM received. Graceful shutdown...
✅ HTTP server closed
```

## Programmatic Access

```typescript
import { logger } from "clearboot";

// Use in your services
logger.minimal("Critical message");
logger.info("Information");
logger.debug("Debug details");
```

## Testing

The logger automatically detects test environments (`NODE_ENV=test`) and sets level to `silent`.

To test logging behavior:

```typescript
import { logger } from "clearboot";

test("custom logger transport", () => {
  const messages: string[] = [];

  logger.configure({
    level: "info",
    transport: (msg) => messages.push(msg),
  });

  logger.info("Test message");
  expect(messages).toContain("Test message");
});
```

## Migration from console.log

If you were using `console.log` in your application:

**Before:**

```typescript
console.log("Server started");
```

**After:**

```typescript
import { logger } from "clearboot";
logger.info("Server started");
```

Benefits:

- Respects configured log level
- Supports custom formatting/transport
- Auto-silent in tests
