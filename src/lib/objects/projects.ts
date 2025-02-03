import { FEATURE, JOB_TYPE, PROJECT_NAME, type project } from './types';

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
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.PROFILE_CREATION,
		requirements:
			'Users can create a profile with their name, contact info, and age.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.HELLO_WORLD],
		costs: {
			product: 10,
			engineering: 20,
			design: 10,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: 10,
			functionality: 20,
			attractiveness: 0,
			security: 15,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.INTERESTS,
		requirements:
			'Users can enter what they like and have those interests on their profile.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 15,
			engineering: 25,
			design: 15,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: 15,
			functionality: 25,
			attractiveness: 20,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.LOVE_FINDER_V1,
		requirements: "Using users interests', match users who might be good fits.",
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.INTERESTS],
		costs: {
			product: 25,
			engineering: 40,
			design: 10,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: -10,
			functionality: 40,
			attractiveness: 30,
			security: 0,
			easeOfUse: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.ANONYMOUS_SHARING,
		requirements:
			'Allow users to invite users to the site anonymously. Great for virality.',
		feature: FEATURE.ENGAGEMENT,
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 10,
			engineering: 20,
			design: 15,
			growth: 25,
		},
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: 15,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 40,
		},
	},
	{
		name: PROJECT_NAME.NEWSPAPER_ADS,
		requirements:
			'Run ongoing newspaper advertising campaigns to reach potential users looking for love.',
		feature: FEATURE.ENGAGEMENT,
		is_continuous: true,
		weekly_costs: {
			money: 500,
		},
		required_roles: {
			[JOB_TYPE.GROWTH]: 1,
			[JOB_TYPE.DESIGN]: 1,
		},
		target_score: 'virality',
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 5,
			engineering: 0,
			design: 20,
			growth: 25,
		},
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 35,
		},
	},
	{
		name: PROJECT_NAME.PROFILE_PICTURES,
		requirements:
			'Allow users to show what they look like to potential suitors.',
		feature: FEATURE.MEDIA,
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 15,
			engineering: 35,
			design: 25,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: -15,
			easeOfUse: 0,
			functionality: 30,
			attractiveness: 50,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.BASIC_BUG_FIXES_1,
		requirements: 'Fix common bugs and implement basic error tracking.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.HELLO_WORLD],
		costs: {
			product: 5,
			engineering: 20,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 20,
			performance: 15,
			easeOfUse: 10,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.ADVANCED_BUG_FIXES_1,
		requirements: 'Implement automated testing and fix edge case bugs.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.BASIC_BUG_FIXES_1],
		costs: {
			product: 10,
			engineering: 35,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 35,
			performance: 20,
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 15,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.IMPROVED_SERVERS_1,
		requirements: 'Upgrade servers to handle increased load.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.ADVANCED_BUG_FIXES_1],
		costs: {
			product: 5,
			engineering: 45,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 40,
			performance: 45,
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.GEO_LOCATION,
		requirements:
			'Users can set their location and only match with nearby users.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 20,
			engineering: 40,
			design: 15,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: -10,
			easeOfUse: 25,
			functionality: 45,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.BROWSE,
		requirements: 'Let users browse the catalog of other users.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 25,
			engineering: 45,
			design: 30,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: -15,
			easeOfUse: 30,
			functionality: 50,
			attractiveness: 35,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.HEARTING,
		requirements:
			"Users can visit a profile and '❤️' it, alerting the other user.",
		feature: FEATURE.ENGAGEMENT,
		dependencies: [PROJECT_NAME.BROWSE],
		costs: {
			product: 20,
			engineering: 35,
			design: 25,
			growth: 15,
		},
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: 20,
			functionality: 35,
			attractiveness: 40,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.PRIVATE_MESSAGING,
		requirements: 'No more sharing emails when users can message directly.',
		feature: FEATURE.ENGAGEMENT,
		dependencies: [PROJECT_NAME.BROWSE],
		costs: {
			product: 30,
			engineering: 50,
			design: 25,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: -20,
			easeOfUse: 0,
			functionality: 60,
			attractiveness: 45,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.BANNER_ADS,
		requirements: 'Put ads on your site to collect revenue.',
		feature: FEATURE.MONETIZATION,
		dependencies: [],
		costs: {
			product: 15,
			engineering: 25,
			design: 30,
			growth: 20,
		},
		scores: {
			reliability: 0,
			performance: -25,
			easeOfUse: -20,
			functionality: 0,
			attractiveness: -30,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.LOVE_FINDER_V2,
		requirements:
			'Using more information that users provide, match users with higher confidence.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.LOVE_FINDER_V1],
		costs: {
			product: 40,
			engineering: 60,
			design: 20,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: -15,
			easeOfUse: 0,
			functionality: 70,
			attractiveness: 50,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.SUPER_HEART,
		requirements:
			'Users can pay to SuperHeart someone on your website, boosting their visibility above those who receive a regular Heart.',
		feature: FEATURE.MONETIZATION,
		dependencies: [PROJECT_NAME.HEARTING],
		costs: {
			product: 25,
			engineering: 40,
			design: 35,
			growth: 25,
		},
		weekly_revenue_per_user: 1,
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: -10,
			functionality: 40,
			attractiveness: 0,
			security: 0,
			virality: 35,
		},
	},
	{
		name: PROJECT_NAME.BASIC_BUG_FIXES_2,
		requirements: 'Fix increasingly complex bugs as the system grows.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.IMPROVED_SERVERS_1],
		costs: {
			product: 15,
			engineering: 45,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 45,
			performance: 25,
			easeOfUse: 15,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.ADVANCED_BUG_FIXES_2,
		requirements: 'Implement more sophisticated testing and monitoring.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.BASIC_BUG_FIXES_2],
		costs: {
			product: 20,
			engineering: 65,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 60,
			performance: 35,
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 25,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.IMPROVED_SERVERS_2,
		requirements: 'Further upgrade servers for better performance.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.ADVANCED_BUG_FIXES_2],
		costs: {
			product: 10,
			engineering: 75,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 70,
			performance: 65,
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.PROFILE_POSTS,
		requirements:
			'Enable post creation on Profiles that lets users share more about their day-to-day lives.',
		feature: FEATURE.ENGAGEMENT,
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 35,
			engineering: 55,
			design: 40,
			growth: 15,
		},
		scores: {
			reliability: 0,
			performance: -5,
			easeOfUse: 0,
			functionality: 55,
			attractiveness: 45,
			security: 0,
			virality: 30,
		},
	},
	{
		name: PROJECT_NAME.COMMENTING,
		requirements: 'Users can comment on posts by users on their profiles.',
		feature: FEATURE.ENGAGEMENT,
		dependencies: [PROJECT_NAME.PROFILE_POSTS],
		costs: {
			product: 25,
			engineering: 45,
			design: 30,
			growth: 20,
		},
		scores: {
			reliability: 0,
			performance: -15,
			easeOfUse: 0,
			functionality: 40,
			attractiveness: 35,
			security: 0,
			virality: 40,
		},
	},
	{
		name: PROJECT_NAME.BLOCKING,
		requirements: 'Users can block users if things get awkward.',
		feature: FEATURE.SECURITY,
		dependencies: [PROJECT_NAME.PRIVATE_MESSAGING],
		costs: {
			product: 20,
			engineering: 40,
			design: 15,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: 30,
			functionality: 0,
			attractiveness: 0,
			security: 55,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.LOOKING_FOR,
		requirements:
			'Users can say exactly what they are looking for (quick fun, long-term, etc.) in a standardized way.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.PROFILE_CREATION],
		costs: {
			product: 30,
			engineering: 35,
			design: 25,
			growth: 15,
		},
		scores: {
			reliability: 0,
			performance: 0,
			easeOfUse: 35,
			functionality: 45,
			attractiveness: 40,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.LOVE_FINDER_V3,
		requirements:
			'Using more information, improve the confidence of matches. Also tweaks the Browse page to be automatically sorted by confidence.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.LOVE_FINDER_V2],
		costs: {
			product: 50,
			engineering: 80,
			design: 30,
			growth: 0,
		},
		scores: {
			reliability: 0,
			performance: -25,
			easeOfUse: 0,
			functionality: 85,
			attractiveness: 60,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.BASIC_BUG_FIXES_3,
		requirements: 'Fix critical bugs in the complex system.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.IMPROVED_SERVERS_2],
		costs: {
			product: 25,
			engineering: 70,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 75,
			performance: 40,
			easeOfUse: 20,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.ADVANCED_BUG_FIXES_3,
		requirements:
			'Implement advanced system monitoring and automated recovery.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.BASIC_BUG_FIXES_3],
		costs: {
			product: 30,
			engineering: 90,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 85,
			performance: 50,
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 35,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.IMPROVED_SERVERS_3,
		requirements: 'Final server upgrades for maximum performance.',
		feature: FEATURE.CORE_WEBSITE,
		dependencies: [PROJECT_NAME.ADVANCED_BUG_FIXES_3],
		costs: {
			product: 15,
			engineering: 100,
			design: 0,
			growth: 0,
		},
		scores: {
			reliability: 100,
			performance: 90,
			easeOfUse: 0,
			functionality: 0,
			attractiveness: 0,
			security: 0,
			virality: 0,
		},
	},
	{
		name: PROJECT_NAME.AD_FREE,
		requirements: 'Allow users to pay to never see ads.',
		feature: FEATURE.MONETIZATION,
		dependencies: [PROJECT_NAME.BANNER_ADS],
		costs: {
			product: 20,
			engineering: 35,
			design: 25,
			growth: 25,
		},
		weekly_revenue_per_user: 2,
		scores: {
			reliability: 0,
			performance: 20,
			easeOfUse: 25,
			functionality: 0,
			attractiveness: 35,
			security: 0,
			virality: 0,
		},
	},
];
