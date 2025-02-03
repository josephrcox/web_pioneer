export type game = {
	id: number;
	website: website;
	tick: number; // 0-8
};

export type website = {
	id: number;
	name: string;
	day: number; // start at 0
	money: number;
	users: number;
	retention: number;
	server_costs: {
		weekly_spend: number; // minimum 50
		user_capacity: number; // calculated as weekly_spend * 40
	};
	user_changes: {
		net_change_today: number;
		rolling_average: number;
		daily_history: number[]; // Store last 7 days of changes
	};
	profit_changes: {
		net_change_today: number;
		rolling_average: number;
		daily_history: number[]; // Store last 7 days of changes
	};
	// Scores start at 0 but work their way up. No maximum. They are compared based on ratios.
	// For example, if a site has a functionality of 1000 but a reliability of 10,
	// ... then they are going to have stability issues.
	scores: {
		reliability: number; // Will the site stay up?
		performance: number; // How fast is the site?
		easeOfUse: number; // How easy is it to use the site?
		functionality: number; // What can people do on the site?
		attractiveness: number; // Do people actually want to use the site?
		security: number; // How secure is the site?
		virality: number; // How easy is it to get new users?
	};
	employees: employee[];
	projects: projectRecord[];
};

export type projectRecord = {
	project: project;
	costs_remaining: {
		product: number;
		engineering: number;
		design: number;
		growth: number;
	};
	assignees: number[];
	completed: boolean;
	rules: {
		paid_only: boolean;
		weekly_ad_spend?: number; // Amount to spend on ads per week
	};
};

// job type enum
export enum JOB_TYPE {
	ENGINEERING = 'engineering',
	PRODUCT = 'product',
	DESIGN = 'design',
	GROWTH = 'growth',
}

export type employee = {
	id: number;
	name: string;
	job: JOB_TYPE;
	xp: number; //10000-10000
	date_hired: number;
	happiness: number; // 0 - 100
	salary: number;
	contributions: number;
};

export enum FEATURE {
	CORE_WEBSITE = 'core website',
	MONETIZATION = 'monetization',
	SECURITY = 'security',
	MEDIA = 'media',
	ENGAGEMENT = 'engagement',
	USER_EXPERIENCE = 'user experience',
}

export enum PROJECT_NAME {
	HELLO_WORLD = 'Hello World',
	PROFILE_CREATION = 'Profile Creation',
	INTERESTS = 'Interests',
	LOVE_FINDER_V1 = 'Love Finder v1',
	ANONYMOUS_SHARING = 'Anonymous Sharing',
	NEWSPAPER_ADS = 'Newspaper Ads',
	PROFILE_PICTURES = 'Profile Pictures',
	BASIC_BUG_FIXES_1 = 'Basic Bug Fixes #1',
	ADVANCED_BUG_FIXES_1 = 'Advanced Bug Fixes #1',
	IMPROVED_SERVERS_1 = 'Improved Servers #1',
	GEO_LOCATION = 'Geo-location',
	BROWSE = 'Browse',
	HEARTING = 'Hearting',
	PRIVATE_MESSAGING = 'Private Messaging',
	BANNER_ADS = 'Banner Ads',
	LOVE_FINDER_V2 = 'Love Finder v2',
	SUPER_HEART = 'SuperHeart',
	BASIC_BUG_FIXES_2 = 'Basic Bug Fixes #2',
	ADVANCED_BUG_FIXES_2 = 'Advanced Bug Fixes #2',
	IMPROVED_SERVERS_2 = 'Improved Servers #2',
	PROFILE_POSTS = 'Profile Posts',
	COMMENTING = 'Commenting',
	BLOCKING = 'Blocking',
	LOOKING_FOR = 'Looking For',
	LOVE_FINDER_V3 = 'Love Finder v3',
	BASIC_BUG_FIXES_3 = 'Basic Bug Fixes #3',
	ADVANCED_BUG_FIXES_3 = 'Advanced Bug Fixes #3',
	IMPROVED_SERVERS_3 = 'Improved Servers #3',
	AD_FREE = 'Ad-free',
}

// Teams can have different projects to work on.
export type project = {
	name: PROJECT_NAME;
	requirements: string;
	feature: FEATURE;
	dependencies?: PROJECT_NAME[];
	is_continuous?: boolean;
	weekly_costs?: {
		money: number;
	};
	weekly_revenue_per_user?: number;
	required_roles?: {
		[key in JOB_TYPE]?: number;
	};
	target_score?: keyof website['scores']; // The score this continuous project affects
	costs: {
		product: number;
		engineering: number;
		design: number;
		growth: number;
	};
	scores: {
		reliability: number;
		performance: number;
		easeOfUse: number;
		functionality: number;
		attractiveness: number;
		security: number;
		virality: number;
	};
};

export type MonetizationConfig = {
	banner_ad_revenue_per_user_per_week: number;
	super_heart_revenue_per_user_per_week: number;
	ad_free_revenue_per_user_per_week: number;
};
