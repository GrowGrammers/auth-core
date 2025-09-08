import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup/unit.setup.ts'],
    exclude: [
      'node_modules/',
      'dist/',
      'test/integration/**/*', // 통합 테스트는 CLI로만 실행
      '**/*.d.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
