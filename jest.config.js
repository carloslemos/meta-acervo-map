export default {
  testEnvironment: 'node',
  testMatch: ['**/src/lib/__tests__/**/*.test.js'],
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
