/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^react-native-svg$': '<rootDir>/src/__mocks__/react-native-svg.ts',
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          module: 'CommonJS',
          moduleResolution: 'node',
          ignoreDeprecations: '5.0',
          types: ['jest', 'node']
        }
      }
    ]
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs']
}
