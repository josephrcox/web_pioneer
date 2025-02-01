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
};

export enum FEATURE {
	CORE_WEBSITE = 'core website',
	MONETIZATION = 'monetization',
	SECURITY = 'security',
	MEDIA = 'media',
	SOCIAL = 'social',
	ENGAGEMENT = 'engagement',
	USER_EXPERIENCE = 'user experience',
}

export enum PROJECT_NAME {
	HELLO_WORLD = 'Hello World',
	ACCOUNT_CREATION = 'Account Creation',
	ACCOUNT_DELETION = 'Account Deletion',
	PHOTO_UPLOAD = 'Photo Upload',
	// Core Blog Features
	BASIC_BLOG_POST = 'Basic Blog Post',
	RICH_TEXT_EDITOR = 'Rich Text Editor',
	BLOG_CATEGORIES = 'Blog Categories',
	BLOG_SEARCH = 'Blog Search',
	// Engagement Features
	COMMENT_SYSTEM = 'Comment System',
	USER_PROFILES = 'User Profiles',
	FOLLOW_SYSTEM = 'Follow System',
	LIKE_SYSTEM = 'Like System',
	NEWSLETTER = 'Newsletter Integration',
	// Media Features
	IMAGE_GALLERY = 'Image Gallery',
	VIDEO_EMBEDDING = 'Video Embedding',
	// Monetization
	PREMIUM_CONTENT = 'Premium Content',
	SUBSCRIPTION_SYSTEM = 'Subscription System',
	AD_INTEGRATION = 'Ad Integration',
	// Analytics & Growth
	SEO_OPTIMIZATION = 'SEO Optimization',
	ANALYTICS_DASHBOARD = 'Analytics Dashboard',
	// Security & Performance
	CACHING_SYSTEM = 'Caching System',
	SPAM_PROTECTION = 'Spam Protection',
	BACKUP_SYSTEM = 'Backup System',
	ANTI_BOT_SYSTEM = 'Anti-Bot Protection',
	MEDIA_SCANNING = 'Media Security Scanning',
	DDOS_PROTECTION = 'DDoS Protection',
	BRUTE_FORCE_PROTECTION = 'Brute Force Protection',
	// Growth & Distribution
	SOCIAL_SHARING = 'Social Sharing',
	RSS_FEED = 'RSS Feed',
	CROSS_POSTING = 'Cross Posting',
	CONTENT_SCHEDULING = 'Content Scheduling',
	AUTHOR_COLLABORATION = 'Author Collaboration',
	READING_TIME = 'Reading Time Estimates',
	RELATED_POSTS = 'Related Posts',
	TAG_SYSTEM = 'Tag System',
	SERIES_POSTS = 'Series Posts',
	EMAIL_DIGESTS = 'Email Digests',
	// Continuous Projects
	NEWSPAPER_ADS = 'Newspaper Ads',
	SOCIAL_MEDIA_MANAGEMENT = 'Social Media Management',
	CONTENT_MARKETING = 'Content Marketing',
	COMMUNITY_MANAGEMENT = 'Community Management',
	SEO_MAINTENANCE = 'SEO Maintenance',
	// Performance & Reliability
	BASIC_BUG_FIXES = 'Basic Bug Fixes',
	ADVANCED_BUG_FIXES = 'Advanced Bug Fixes',
	CRITICAL_BUG_FIXES = 'Critical Bug Fixes',
	SERVER_UPGRADE_T1 = 'Server Upgrade Tier 1',
	SERVER_UPGRADE_T2 = 'Server Upgrade Tier 2',
	SERVER_UPGRADE_T3 = 'Server Upgrade Tier 3',
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
