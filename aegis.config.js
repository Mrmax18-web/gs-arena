export default {
  framework: 'vite',
  language: 'typescript',
  srcDir: './src',
  entryPoint: './src/main.tsx',
  outDir: './dist',
  plugins: ['react', 'firebase', 'supabase'],
  rules: {
    enforceLazyLoading: true,
    maxChunkSize: 500,
    ignorePatterns: ['node_modules', 'dist', '*.test.tsx']
  }
};
