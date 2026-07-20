export default {
  testEnvironment: 'node',
  testMatch: ['**/src/lib/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Simula as constantes injetadas pelo Vite `define` em tempo de build.
  globals: {
    __APP_VERSION__: '0.0.0-test',
  },
};
