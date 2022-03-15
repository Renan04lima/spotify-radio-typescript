module.exports = {
  roots: ['<rootDir>/server/tests'],
  collectCoverageFrom: [
    '<rootDir>/server/**/*.ts'
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'babel',
  testEnvironment: 'node',
  transform: {
    '.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/server/$1'
  }
}
