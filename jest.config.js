export default {
  testEnvironment: 'node',
  testMatch: ['**/src/lib/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
