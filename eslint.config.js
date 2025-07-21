import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
    {
        ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts', 'bin/**'],
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            // Disable all default rules - we only want padding rules
            ...Object.fromEntries(
                Object.keys(eslint.configs.recommended.rules).map((rule) => [rule, 'off'])
            ),
            // Only enable the padding rule
            '@stylistic/padding-line-between-statements': [
                'error',
                // Require blank line after variable declarations before if/for/while/switch/throw/try
                {
                    blankLine: 'always',
                    prev: ['const', 'let', 'var'],
                    next: ['if', 'for', 'while', 'switch', 'throw', 'try'],
                },
                // Require blank line before return statements
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'return',
                },
                // Require blank line after directive prologue (like 'use strict')
                {
                    blankLine: 'always',
                    prev: 'directive',
                    next: '*',
                },
                // Require blank line after block statements before variable declarations
                {
                    blankLine: 'always',
                    prev: 'block-like',
                    next: ['const', 'let', 'var'],
                },
            ],
        },
    },
    prettier, // Ensures no conflicts with formatting
];
