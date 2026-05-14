import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import i18next from 'eslint-plugin-i18next';

export default tseslint.config(
	{ ignores: ['dist'] },
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			i18next,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

			// Prevent hardcoded user-visible strings — use t() from react-i18next instead.
			// Runs on staged files via lint-staged, so new code must comply; existing
			// violations are only surfaced when that file is next touched.
			// To opt out of a specific line: // eslint-disable-next-line i18next/no-literal-string
			'i18next/no-literal-string': [
				'error',
				{
					mode: 'jsx-only',
					// Only check attributes that surface text to users
					'jsx-attributes': {
						include: [
							'placeholder',
							'title',
							'aria-label',
							'aria-placeholder',
							'aria-roledescription',
							'aria-valuetext',
							'alt',
							'label',
							'description',
						],
					},
					// Exclude JS call sites that contain strings for non-UI purposes
					callees: {
						exclude: [
							'^t$', // react-i18next translation function — keys are fine
							'^tc$', // common namespace alias (useTranslation('common'))
							'^i18n\\.t$',
							'window\\..*',
							'console\\..*',
							'Object\\..*',
							'Array\\..*',
							'Math\\..*',
							'JSON\\..*',
							'toast\\..*',
							'cn',
							'clsx',
							'navigate',
							'setTimeout',
							'setInterval',
							'clearInterval',
							'clearTimeout',
							'addEventListener',
							'removeEventListener',
							'dispatchEvent',
							'new RegExp',
							'new Error',
							'new URL',
							'new Date',
							'require',
						],
					},
					// Ignore strings that are clearly not display text
					words: {
						exclude: [
							'^.$', // single characters (avatar initials, separators)
							'^\\s*$', // whitespace-only
							'^https?://', // URLs
							'^#[a-fA-F0-9]{3,8}$', // hex colour codes
						],
					},
					// Ignore components that intentionally render raw strings
					'jsx-components': {
						exclude: ['Trans', 'Route', 'Navigate'],
					},
				},
			],
		},
	},
);
