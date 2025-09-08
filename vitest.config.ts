import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup/unit.setup.ts'],
    include: [
      'test/unit/**/*.test.ts', // 단위 테스트만 포함
      'test/utils/**/*.test.ts' // 유틸리티 테스트 포함
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'examples/**/*', // examples 폴더 전체 제외
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
