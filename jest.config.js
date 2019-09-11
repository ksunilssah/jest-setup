module.exports = {
  rootDir: '../',
  verbose: true,
  testURL: 'http://localhost/',
  setupFiles: ['<rootDir>/config/jest.setup.js'],
  moduleDirectories: ['node_modules'],
  testPathIgnorePatterns: ['<rootDir>/.next/'],
  testResultsProcessor: 'jest-sonar-reporter',
  collectCoverage: true,
  coverageDirectory: '<rootDir>/reports/coverage',
  collectCoverageFrom: [
    '**app/components/organisms/Header.js',
    '!**app/components/**/*.js',
    '!**app/global/**/*.js',
    '!**app/lib/**/*.js',
    '!**app/constants/**/*.js',
    '!**app/global/constants/*.js',
    '!**app/constants/*.js',
    '!**app/constants/api/*.js',
    '!**/app/**/types/*.js',
    '!**app/components/**/index.js',
    '!**app/lib/fake/*.js',
    '!**/app/**/tests/data.js',
    '!**/app/**/*.schema.js',
    '!**/app/**/*.config.js',
    '!**/app/**/*.metrics.js',
    '!**/app/**/*.style.js',
    /**
     * Added to ignore since StoreLocater and Profile are dummy Pages
     * Remove this in actual Story implementation
     */
  ],
  moduleNameMapper: {
    '^components(.*)$': '<rootDir>/app/components/$1',
    '^utils(.*)$': '<rootDir>/app/utils/$1',
    '^lib(.*)$': '<rootDir>/app/lib/$1',
    '^constants(.*)$': '<rootDir>/app/constants/$1',
  },
  // Removing the following ignore patterns to assess why parts of it
  // cannot be covered - to be revisited

  // coveragePathIgnorePatterns: ['<rootDir>/.*\\.style\\.js$'],
  coverageReporters: ['lcov', 'json'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  /**
   * This can be used to specifically test certain cases individually
   */
  // testMatch: [
  //   '**/__tests__/**/*.js?(x)',
  // ],
};
