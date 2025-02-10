/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontSize: {
				xs: '0.875rem', // 14px (was 12px)
				sm: '1rem', // 16px (was 14px)
				md: '1.125rem', // 18px (our custom size)
				base: '1.25rem', // 20px (was 16px)
				lg: '1.375rem', // 22px (was 18px)
				xl: '1.5rem', // 24px (was 20px)
				'2xl': '1.75rem', // 28px (was 24px)
				'3xl': '2rem', // 32px (was 30px)
				'4xl': '2.5rem', // 40px (was 36px)
				'5xl': '3rem', // 48px (was 48px)
			},
		},
	},
	plugins: [require('daisyui')],
};
