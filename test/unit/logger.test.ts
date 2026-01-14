import { logger, LogLevel } from '../../src/lib/common/logger';

describe('Logger', () => {
    // Save original env
    const originalEnv = process.env.NODE_ENV;
    const originalLogLevel = process.env.LOG_LEVEL;

    afterEach(() => {
        // Restore env
        process.env.NODE_ENV = originalEnv;
        process.env.LOG_LEVEL = originalLogLevel;
        // Reset logger to default
        logger.configure({});
    });

    describe('Log Levels', () => {
        test('silent level logs nothing', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'silent',
                transport: (msg) => messages.push(msg)
            });

            logger.minimal('minimal');
            logger.info('info');
            logger.debug('debug');

            expect(messages.length).toBe(0);
        });

        test('minimal level logs only minimal', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'minimal',
                transport: (msg) => messages.push(msg)
            });

            logger.minimal('minimal');
            logger.info('info');
            logger.debug('debug');

            expect(messages.length).toBe(1);
            expect(messages[0]).toBe('minimal');
        });

        test('info level logs minimal and info', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                transport: (msg) => messages.push(msg)
            });

            logger.minimal('minimal');
            logger.info('info');
            logger.debug('debug');

            expect(messages.length).toBe(2);
            expect(messages[0]).toBe('minimal');
            expect(messages[1]).toBe('info');
        });

        test('debug level logs everything', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'debug',
                transport: (msg) => messages.push(msg)
            });

            logger.minimal('minimal');
            logger.info('info');
            logger.debug('debug');

            expect(messages.length).toBe(3);
            expect(messages[0]).toBe('minimal');
            expect(messages[1]).toBe('info');
            expect(messages[2]).toBe('debug');
        });
    });

    describe('Auto-detection', () => {
        test('defaults to silent in test environment', () => {
            process.env.NODE_ENV = 'test';
            const messages: string[] = [];
            
            logger.configure({
                transport: (msg) => messages.push(msg)
            });

            logger.info('test');
            expect(messages.length).toBe(0);
        });

        test('respects LOG_LEVEL environment variable', () => {
            process.env.NODE_ENV = 'production';
            process.env.LOG_LEVEL = 'debug';
            const messages: string[] = [];

            logger.configure({
                transport: (msg) => messages.push(msg)
            });

            logger.debug('test');
            expect(messages.length).toBe(1);
        });

        test('explicit config overrides environment', () => {
            process.env.NODE_ENV = 'test';
            const messages: string[] = [];

            logger.configure({
                level: 'info',
                transport: (msg) => messages.push(msg)
            });

            logger.info('test');
            expect(messages.length).toBe(1);
        });
    });

    describe('Formatting Options', () => {
        test('adds timestamp when enabled', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                timestamp: true,
                transport: (msg) => messages.push(msg)
            });

            logger.info('test message');
            expect(messages[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] test message$/);
        });

        test('adds prefix when configured', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                prefix: '[MyApp]',
                transport: (msg) => messages.push(msg)
            });

            logger.info('test');
            expect(messages[0]).toBe('[MyApp] test');
        });

        test('strips colors when disabled', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                colors: false,
                transport: (msg) => messages.push(msg)
            });

            logger.info('\x1b[32mGreen text\x1b[0m');
            expect(messages[0]).toBe('Green text');
        });

        test('preserves colors when enabled', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                colors: true,
                transport: (msg) => messages.push(msg)
            });

            logger.info('\x1b[32mGreen text\x1b[0m');
            expect(messages[0]).toBe('\x1b[32mGreen text\x1b[0m');
        });

        test('combines timestamp and prefix', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                timestamp: true,
                prefix: '[MyApp]',
                transport: (msg) => messages.push(msg)
            });

            logger.info('test');
            // Format is: [timestamp] [prefix] message
            expect(messages[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[MyApp\] test$/);
        });
    });

    describe('Custom Formatter', () => {
        test('uses custom formatter when provided', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                formatter: (msg, level) => `[${level.toUpperCase()}] ${msg}`,
                transport: (msg) => messages.push(msg)
            });

            logger.info('test');
            expect(messages[0]).toBe('[INFO] test');
        });

        test('formatter receives timestamp when enabled', () => {
            const timestamps: (Date | undefined)[] = [];
            logger.configure({
                level: 'info',
                timestamp: true,
                formatter: (msg, level, ts) => {
                    timestamps.push(ts);
                    return msg;
                },
                transport: () => {}
            });

            logger.info('test');
            expect(timestamps[0]).toBeInstanceOf(Date);
        });

        test('formatter overrides other formatting options', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                prefix: '[Ignored]',
                timestamp: true,
                formatter: (msg) => `CUSTOM: ${msg}`,
                transport: (msg) => messages.push(msg)
            });

            logger.info('test');
            expect(messages[0]).toBe('CUSTOM: test');
        });
    });

    describe('Emoji handling', () => {
        test('strips emoji when disabled', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                emoji: false,
                transport: (msg) => messages.push(msg)
            });

            logger.info('🔥 Error happened');
            expect(messages[0]).toBe(' Error happened');
        });

        test('keeps emoji when enabled', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                emoji: true,
                transport: (msg) => messages.push(msg)
            });

            logger.info('🔥 Error happened');
            expect(messages[0]).toBe('🔥 Error happened');
        });
    });

    describe('Custom Transport', () => {
        test('sends messages to custom transport', () => {
            const messages: string[] = [];
            const levels: LogLevel[] = [];

            logger.configure({
                level: 'debug',
                transport: (msg, level) => {
                    messages.push(msg);
                    levels.push(level);
                }
            });

            logger.minimal('m');
            logger.info('i');
            logger.debug('d');

            expect(messages).toEqual(['m', 'i', 'd']);
            expect(levels).toEqual(['minimal', 'info', 'debug']);
        });

        test('does not log to console when transport provided', () => {
            const spy = jest.spyOn(console, 'log');

            logger.configure({
                level: 'info',
                transport: () => {}
            });

            logger.info('test');
            expect(spy).not.toHaveBeenCalled();

            spy.mockRestore();
        });
    });

    describe('JSON Logging', () => {
        test('can produce JSON logs for aggregators', () => {
            const messages: string[] = [];
            logger.configure({
                level: 'info',
                formatter: (msg, level, ts) => JSON.stringify({
                    level: level.toUpperCase(),
                    message: msg.replace(/\x1b\[[0-9;]*m/g, ''),
                    timestamp: ts?.toISOString()
                }),
                timestamp: true,
                transport: (msg) => messages.push(msg)
            });

            logger.info('Test message');
            const parsed = JSON.parse(messages[0]);
            
            expect(parsed.level).toBe('INFO');
            expect(parsed.message).toBe('Test message');
            expect(parsed.timestamp).toBeDefined();
        });
    });
});
