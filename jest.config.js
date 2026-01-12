module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './',
    testMatch: ['<rootDir>/test/**/*.test.ts'],

    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
        'src/lib/**/*.ts',
        '!src/lib/index.ts',
        '!src/lib/**/index.ts',
        '!src/app/**/*.ts'
    ]
};