import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'

const tsFiles = ['ai-interview/**/*.{ts,tsx}']
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/storage/**',
      '**/.cache/**',
      '**/*.tsbuildinfo'
    ]
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  { files: ['**/*.mjs'], languageOptions: { sourceType: 'module' } },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: tsFiles })),
  {
    files: tsFiles,
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': hooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }
      ],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    rules: {
      // 控制流始终带大括号，每条声明只定义一个变量，避免密集写法再次出现。
      curly: ['error', 'all'],
      'one-var': ['error', 'never']
    }
  }
]
