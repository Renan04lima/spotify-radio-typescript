const defaultConfig = {
  coverageDirectory: 'coverage',
  coverageProvider: 'babel',
  coverageReporters: [
    'text',
    'lcov'
  ],
  coverageThreshold: {
    global: {
      branch: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  maxWorkers: '50%',
  watchPathIgnorePatterns: [
    'node_modules'
  ],
  transformIgnorePatterns: [
    'node_modules'
  ],
  transform: {
    '.+\\.ts$': 'ts-jest'
  }
}

module.exports = {
  projects: [
    {
      ...defaultConfig,
      testEnvironment: 'node',
      displayName: 'backend',
      collectCoverageFrom: [
        'server/',
        '!server/index.ts'
      ],
      transformIgnorePatterns: [
        ...defaultConfig.transformIgnorePatterns,
        'public'
      ],
      testMatch: [
        '**/tests/**/server/**/*.test.ts'
      ]
    },
    {
      ...defaultConfig,
      testEnvironment: 'jsdom',
      displayName: 'frontend',
      collectCoverageFrom: [
        'public/'
      ],
      transformIgnorePatterns: [
        ...defaultConfig.transformIgnorePatterns,
        'server'
      ],
      testMatch: [
        '**/tests/**/public/**/*.test.ts'
      ]
    }
  ]
}
