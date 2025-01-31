export type game = {
	id: number;
	website: website;
};

export type website = {
	id: number;
	name: string;
	day: number; // start at 0
	money: number;
	users: number;
	wau: number;
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
}

// Teams can have different projects to work on.
export type project = {
	name: PROJECT_NAME;
	requirements: string;
	feature: FEATURE;
	dependencies?: PROJECT_NAME[]; // Array of project names that must be completed first
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
	};
};
