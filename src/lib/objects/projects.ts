import { FEATURE, PROJECT_NAME, type project } from './types';

// Project name constants to avoid typos in dependencies
const PROJECT_NAMES = {
	HELLO_WORLD: 'Hello World',
	ACCOUNT_CREATION: 'Account Creation',
	ACCOUNT_DELETION: 'Account Deletion',
	PHOTO_UPLOAD: 'Photo Upload',
} as const;

export const projects: project[] = [
	{
		name: PROJECT_NAME.HELLO_WORLD,
		requirements: 'A page that says Hello World, at your domain.',
		feature: FEATURE.CORE_WEBSITE,
		costs: {
			product: 0,
			engineering: 5,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 5,
			performance: 5,
			easeOfUse: 5,
			functionality: 0,
			attractiveness: 0,
			security: 0,
		},
	},
	{
		name: PROJECT_NAME.ACCOUNT_CREATION,
		requirements: 'Allow users to create accounts with email and password.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.HELLO_WORLD],
		costs: {
			product: 10,
			engineering: 15,
			design: 5,
			growth: 0,
		},
		scores: {
			reliability: 10,
			performance: 5,
			easeOfUse: 8,
			functionality: 10,
			attractiveness: 0,
			security: 15,
		},
	},
	{
		name: PROJECT_NAME.ACCOUNT_DELETION,
		requirements: 'Allow users to delete their accounts.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.ACCOUNT_CREATION],
		costs: {
			product: 5,
			engineering: 10,
			design: 2,
			growth: 0,
		},
		scores: {
			reliability: 8,
			performance: 5,
			easeOfUse: 5,
			functionality: 5,
			attractiveness: 0,
			security: 10,
		},
	},
	{
		name: PROJECT_NAME.PHOTO_UPLOAD,
		requirements: 'Allow users to upload and store photos.',
		feature: FEATURE.MEDIA,
		dependencies: [PROJECT_NAME.ACCOUNT_CREATION],
		costs: {
			product: 8,
			engineering: 12,
			design: 8,
			growth: 0,
		},
		scores: {
			reliability: 10,
			performance: 8,
			easeOfUse: 7,
			functionality: 15,
			attractiveness: 10,
			security: 8,
		},
	},
];
