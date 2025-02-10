import {
	JOB_TYPE,
	PROJECT_NAME,
	type employee,
	type investmentOpportunity,
	type project,
	type projectRecord,
	type website,
	type MarketingConfig,
} from './objects/types';
import { projects } from './objects/projects';
import {
	MONETIZATION_LIMITS,
	monetizationConfig,
} from './objects/monetization';
import { MARKETING_LIMITS } from './objects/marketing';
import { g } from './store';

export function numberToMoney(number: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(number);
}

export function numberWithCommas(number: number) {
	return number.toLocaleString('en-US');
}

export function getJobColor(job: JOB_TYPE, withPadding = false) {
	let color = 'text-white cursor-pointer px-1 ';
	switch (job) {
		case JOB_TYPE.GROWTH:
			color += 'bg-green-700';
			break;
		case JOB_TYPE.DESIGN:
			color += 'bg-blue-700';
			break;
		case JOB_TYPE.ENGINEERING:
			color += 'bg-yellow-700';
			break;
		case JOB_TYPE.PRODUCT:
			color += 'bg-red-700';
			break;
		default:
			color += 'bg-white';
			break;
	}
	if (withPadding) {
		return color + ' px-2 py-1';
	}
	return color;
}

const commonFirstNames = [
	// Male names
	'Michael',
	'Christopher',
	'Matthew',
	'Joshua',
	'Andrew',
	'Daniel',
	'Joseph',
	'William',
	'Ryan',
	'David',
	// Female names
	'Jessica',
	'Ashley',
	'Jennifer',
	'Sarah',
	'Stephanie',
	'Nicole',
	'Elizabeth',
	'Rachel',
	'Megan',
	'Amanda',
];

const commonLastNames = [
	'Smith',
	'Johnson',
	'Williams',
	'Brown',
	'Jones',
	'Garcia',
	'Miller',
	'Davis',
	'Rodriguez',
	'Martinez',
	'Hernandez',
	'Lopez',
	'Gonzalez',
	'Wilson',
	'Anderson',
	'Thomas',
	'Taylor',
	'Moore',
	'Jackson',
	'Martin',
];

export function generateEmployeeName() {
	const randomFirstName =
		commonFirstNames[Math.floor(Math.random() * commonFirstNames.length)];
	const randomLastName =
		commonLastNames[Math.floor(Math.random() * commonLastNames.length)];
	return `${randomFirstName} ${randomLastName}`;
}

export function getAvailableProjects(website: website): project[] {
	if (!website) return [];
	// Get list of completed project names from the website's projects
	const completedProjectNames = new Set(
		website.projects
			.map(migrateProjectRecord)
			.filter((pr) => pr.completed)
			.map((pr) => pr.project.name),
	);

	// Get list of in-progress project names
	const inProgressProjectNames = new Set(
		website.projects
			.map(migrateProjectRecord)
			.filter((pr) => !pr.completed)
			.map((pr) => pr.project.name),
	);

	// Filter available projects based on dependencies and exclude in-progress projects
	return projects.filter((project: project) => {
		// Skip if project is already in progress
		if (inProgressProjectNames.has(project.name)) return false;

		// Skip if project is completed
		if (completedProjectNames.has(project.name)) return false;

		// If project has no dependencies, it's available
		if (!project.dependencies) return true;

		// Check if all dependencies are completed
		return project.dependencies.every((dep: PROJECT_NAME) =>
			completedProjectNames.has(dep),
		);
	});
}

export function getPayingUserPercentage(website: website) {
	// Based on website scores and retention, calculate the percentage of users that pay for the site.
	// retention is already a decimal between 0 and 1
	return website.retention;
}

export function migrateProjectRecord(project: projectRecord): projectRecord {
	const baseProject = project as Omit<projectRecord, 'enabled'>;
	if (!('enabled' in project)) {
		return {
			project: baseProject.project,
			costs_remaining: baseProject.costs_remaining,
			assignees: baseProject.assignees,
			completed: baseProject.completed,
			rules: baseProject.rules,
			enabled: true,
		};
	}
	return project;
}

// Helper function to check if a project is enabled (handles old game files)
export function isProjectEnabled(project: projectRecord): boolean {
	return 'enabled' in project ? project.enabled : true;
}

export function startProject(project: project, website: website) {
	// Update the game state through the store
	g.update((g) => {
		if (!g.website) return g;
		return {
			...g,
			website: {
				...g.website,
				// Migrate any existing projects and add the new one
				projects: [
					...g.website.projects.map(migrateProjectRecord),
					{
						project,
						costs_remaining: { ...project.costs },
						assignees: [] as number[],
						completed: false,
						enabled: true,
						rules: {
							paid_only: false,
						},
					},
				],
			},
		};
	});
}

export function assignEmployee(
	website: website,
	project: project,
	employee: employee,
) {
	const projectRecord = website.projects.find(
		(pr) => pr.project.name === project.name,
	);
	if (projectRecord && !projectRecord.assignees.includes(employee.id)) {
		projectRecord.assignees.push(employee.id);
	}
}

export function adjustEmployeeHappiness(website: website): website {
	for (let employee of website.employees) {
		// This function is called daily and adjusts the employees happiness
		if (getAvailableEmployees(website).includes(employee)) {
			// Employee is idle - should take ~2 weeks to reach 0
			// 14 days * 8 ticks per day = 112 ticks
			// To go from 100 to 0 in 112 ticks = ~0.89 per tick
			employee.happiness -= 0.89;
		} else if (employee.contributions > 0) {
			// Working employees gain happiness based on their contributions
			// Scale happiness gain based on XP - less experienced employees gain more happiness
			const xpScalingFactor = Math.max(0.1, 1 - employee.xp / 5000);
			employee.happiness += (employee.contributions / 10) * xpScalingFactor;
		}

		// clamp between 1 and 100
		employee.happiness = Math.round(
			Math.max(1, Math.min(100, employee.happiness)),
		);

		const employeeIndex = website.employees.findIndex(
			(e) => e.id === employee.id,
		);
		if (employeeIndex !== -1) {
			website.employees[employeeIndex] = employee;
		}
	}

	return website;
}

export function getAvailableEmployees(
	website: website,
	currentProject?: project,
): employee[] {
	const employees = website.employees;
	const unavailableEmployeeIds = new Set<number>();

	// First, find the current project record if it exists
	const currentProjectRecord = currentProject
		? website.projects.find((pr) => pr.project.name === currentProject.name)
		: null;

	website.projects
		.filter((pr) => !pr.completed)
		.forEach((pr) => {
			// For each incomplete project, check which job types still have remaining work
			const jobsWithRemainingWork = Object.entries(pr.costs_remaining)
				.filter(([_, cost]) => cost > 0)
				.map(([jobType]) => jobType);

			// Handle assignees based on whether this is the current project
			pr.assignees.forEach((assigneeId) => {
				const employee = employees.find((e) => e.id === assigneeId);
				if (!employee) return;

				// Only make employee unavailable if their job type still has work to do
				if (jobsWithRemainingWork.includes(employee.job)) {
					unavailableEmployeeIds.add(assigneeId);
				}
			});
		});

	// Filter out employees who are unavailable
	let availableEmployees = employees.filter(
		(e) => !unavailableEmployeeIds.has(e.id),
	);

	// If we're looking at a specific project, filter to only employees who can work on it
	if (currentProject) {
		const projectRecord = website.projects.find(
			(pr) => pr.project.name === currentProject.name,
		);
		availableEmployees = availableEmployees.filter(
			(e) => projectRecord && projectRecord.costs_remaining[e.job] > 0,
		);
	}

	// If we're looking at a specific project, filter out employees already assigned to it
	if (currentProjectRecord) {
		return availableEmployees.filter(
			(e) => !currentProjectRecord.assignees.includes(e.id),
		);
	}

	return availableEmployees;
}

export function getInvestmentOpportunities(
	website: website,
): investmentOpportunity[] {
	let opportunities: investmentOpportunity[] = [];

	// Base valuation on users and revenue, with a 1995-appropriate multiplier
	// In 1995, tech companies were often valued at 2-4x revenue
	const annualRevenue = website.profit_changes.net_change_today * 365;
	const revenueMultiple = 3 + website.retention * 2; // 3-5x multiple based on retention

	// User-based valuation component (users were valuable but not as much as today)
	// In 1995, each user might be worth $2-5
	const userValue = website.users * 3;

	// Basic valuation based on revenue and users
	let valuation = Math.max(50000, annualRevenue * revenueMultiple + userValue);

	// Cap the valuation at a reasonable 1995 level
	// Very few internet companies in 1995 were worth more than $50M
	valuation = Math.min(valuation, 50000000);

	// 30% chance to get an opportunity
	if (Math.random() < 0.3) {
		const randomPercentage = Math.floor(Math.random() * 30) + 2;
		opportunities.push({
			firm: generateInvestmentFirmName(),
			valuation: Math.round(valuation),
			percent: randomPercentage,
			day: website.day,
			expires: website.day + 7,
		});
	}

	return opportunities;
}

export function acceptInvestment(
	website: website,
	opportunity: investmentOpportunity,
): website {
	if (website.investors == undefined) {
		website.investors = [];
	}
	const totalAllowedToSell =
		100 - website.investors.reduce((a, b) => a + b.percent_owned, 0);

	if (totalAllowedToSell < opportunity.percent) {
		return website;
	}

	website.investment_opportunities = website.investment_opportunities.filter(
		(o) => o.firm !== opportunity.firm,
	);
	// Delete all investment opportunities that are null
	website.investment_opportunities = website.investment_opportunities.filter(
		(o) => o !== null,
	);

	website.investors.push({
		firm: opportunity.firm,
		percent_owned: opportunity.percent,
		valuation: opportunity.valuation,
		day_invested: website.day,
	});

	website.money += opportunity.valuation * (opportunity.percent / 100);

	return website;
}

export function getEmployeeContributionScore(employee: employee): number {
	return (employee.xp * (employee.happiness / 100)) / 56 / 40;
}

export function workOnProject(
	project: projectRecord,
	website: website,
): [projectRecord, website] {
	// Skip processing if project is already completed
	if (project.completed || isProjectComplete(project)) {
		return [project, website];
	}

	// Look up assignees based on their IDs for this specific project
	const assignees = website.employees.filter((e) =>
		project.assignees.includes(e.id),
	);

	// Each employee has a productivity score. This is calculated in the moment as it can change.
	// (xp * (happiness/2))/40
	for (let employee of assignees) {
		// For a user with 1000 xp, 0.5 happiness, this is 6.25 points per week.
		// Iterate over project costs
		for (const costType in project.costs_remaining) {
			if (costType === employee.job) {
				// Skip if this resource type is already complete
				if (project.costs_remaining[costType] <= 0) {
					continue;
				}

				const contribution = getEmployeeContributionScore(employee);
				employee.contributions += contribution;
				project.costs_remaining[costType] -= contribution;

				// Find the employee in the website's employee list and update their XP
				const employeeIndex = website.employees.findIndex(
					(e) => e.id === employee.id,
				);
				if (employeeIndex !== -1) {
					// Calculate XP gain with diminishing returns
					// Base XP gain is contribution * 20 (instead of 400)
					// This means 5 contribution points = 100 base XP
					const baseXpGain = contribution * 10;
					employee.happiness += contribution / 10;
					employee.happiness = Math.round(
						Math.max(1, Math.min(100, employee.happiness)),
					);

					// Apply diminishing returns based on current XP
					// As XP approaches 10000, gains become smaller
					const currentXp = website.employees[employeeIndex].xp;
					const xpMultiplier = Math.max(0.05, 1 - currentXp / 5000);

					// Add the scaled XP gain
					const actualXpGain =
						project.costs_remaining[employee.job] <= 0
							? 0
							: Math.floor(baseXpGain * xpMultiplier);
					website.employees[employeeIndex].xp = Math.min(
						10000,
						website.employees[employeeIndex].xp + actualXpGain,
					);

					// Update employee in website
					website.employees[employeeIndex] = employee;
				}
			}
		}
	}

	return [project, website];
}

export function isProjectComplete(project: projectRecord) {
	return Object.values(project.costs_remaining).every((cost) => cost <= 0);
}

export function shipProject(project: projectRecord): projectRecord {
	// Give happiness boost to all employees who contributed
	if (project.assignees.length > 0) {
		g.update((g) => {
			if (!g.website) return g;
			const updatedEmployees = g.website.employees.map((employee) => {
				if (project.assignees.includes(employee.id)) {
					// Random boost between 1-5%
					const happinessBoost = Math.floor(Math.random() * 5) + 1;
					employee.happiness = Math.min(
						100,
						employee.happiness + happinessBoost,
					);
				}
				return employee;
			});
			return {
				...g,
				website: {
					...g.website,
					employees: updatedEmployees,
				},
			};
		});
	}
	project.completed = true;
	return project;
}

export function fireEmployee(employee: employee, website: website): website {
	website.employees = website.employees.filter((e) => e.id != employee.id);

	for (let i = 0; i < website.projects.length; i++) {
		if (website.projects[i].assignees.includes(employee.id)) {
			website.projects[i].assignees.filter((e) => e != employee.id);
		}
	}

	return website;
}

export function addUsers(website: website): website {
	// Calculate total scores
	const totalScores = Object.values(website.scores).reduce(
		(sum, val) => sum + val,
		0,
	);

	// Base organic growth - more generous early scaling, gets harder later
	const baseOrganicGrowth = Math.max(
		website.users < 10 ? 2 : 1, // Guarantee at least 2 new users when very small
		Math.round(
			(Math.random() * Math.sqrt(totalScores)) /
				(website.users < 10
					? 4
					: website.users < 100
					? 6
					: website.users < 1000
					? 8
					: 2),
		),
	);

	// Calculate marketing boost from all active marketing campaigns
	let marketingBoost = 1;
	const marketingContributions: { [key: string]: number } = {};

	const marketingProjects = [
		{
			name: PROJECT_NAME.NEWSPAPER_ADS,
			configKey: 'newspaper_ads_weekly_spend',
			multiplier: MARKETING_LIMITS.NEWSPAPER_ADS.VIRALITY_MULTIPLIER * 0.4,
			baseUsers: 1, // ~24 users per day base
		},
		{
			name: PROJECT_NAME.TV_INFOMERCIAL,
			configKey: 'tv_infomercial_weekly_spend',
			multiplier: MARKETING_LIMITS.TV_INFOMERCIAL.VIRALITY_MULTIPLIER * 0.9,
			baseUsers: 3, // ~72 users per day base
		},
		{
			name: PROJECT_NAME.RADIO_ADS,
			configKey: 'radio_ads_weekly_spend',
			multiplier: MARKETING_LIMITS.RADIO_ADS.VIRALITY_MULTIPLIER * 0.6,
			baseUsers: 2, // ~48 users per day base
		},
		{
			name: PROJECT_NAME.COLLEGE_CAMPUS_CAMPAIGN,
			configKey: 'college_campus_weekly_spend',
			multiplier: MARKETING_LIMITS.COLLEGE_CAMPUS.VIRALITY_MULTIPLIER * 0.7,
			baseUsers: 1.5, // ~36 users per day base
		},
	];

	marketingProjects.forEach(({ name, configKey, multiplier, baseUsers }) => {
		const project = website.projects.find(
			(p) => p.project.name === name && p.completed && p.enabled,
		);
		if (project) {
			const weeklySpend =
				website.marketing_config?.[configKey as keyof MarketingConfig] ??
				project.rules?.weekly_ad_spend ??
				0;
			if (weeklySpend > 0) {
				// New formula: base users + spend-based boost with better scaling
				const spendBoost =
					(Math.sqrt(weeklySpend) / 30 + baseUsers) * // Reduced scaling
					multiplier *
					(Math.random() * 0.2 + 0.9);
				marketingBoost *= 1 + spendBoost;
				marketingContributions[name] = spendBoost * baseOrganicGrowth * 1.5;
			}
		}
	});

	// Calculate viral coefficient based on virality score and total scores
	let maxForViral = website.users < 1000 ? 1000 : website.users / 10;
	if (maxForViral < 1000) {
		maxForViral = 1000;
	}
	const viralityMultiplier = Math.min(0.4, totalScores / maxForViral); // Less aggressive scaling
	const viralCoefficient =
		1 +
		(website.scores.virality /
			(website.users < 10
				? 10
				: website.users < 20000
				? 20
				: website.users / 2000)) *
			viralityMultiplier;

	// Calculate viral growth with better early game scaling
	const baseViralGrowth =
		website.users === 0 && website.scores.virality > 0 ? 2 : 0; // Increased from 1 to 2
	const viralGrowth = Math.max(
		baseViralGrowth,
		(Math.max(1, website.users) / (website.users < 100 ? 25 : 50)) * // Made viral spread faster
			(viralCoefficient - 1) *
			(0.95 + Math.random() * 0.2),
	);

	// Random fluctuation between -5% and +5% of current growth
	const currentGrowth = baseOrganicGrowth + viralGrowth;
	const randomFluctuation = currentGrowth * (Math.random() * 0.1 - 0.05);

	// Calculate total new users with marketing boost
	let newUsers = Math.floor(
		(baseOrganicGrowth + viralGrowth + randomFluctuation) * marketingBoost,
	);

	// Add "internet adoption" limiting factor
	const maxPotentialUsers = 16000000;
	// More forgiving early game slowdown
	const adoptionFactor = Math.max(
		0.1,
		Math.pow(
			1 - website.users / maxPotentialUsers,
			website.users < 100 ? 0.5 : website.users < 1000 ? 0.8 : 1.2, // Made early scaling much more forgiving
		),
	);
	newUsers = Math.floor(newUsers * adoptionFactor);

	// Growth caps based on user count - more forgiving early, still prevents unrealistic growth
	const maxDailyGrowth = Math.min(
		website.users < 10 ? 1.0 : website.users < 100 ? 0.5 : 0.25, // Much higher early game caps
		Math.max(
			0.05, // Increased minimum growth rate
			(website.users < 100 ? 0.5 : 0.25) -
				(website.users / maxPotentialUsers) * 0.13,
		),
	);
	const maxHourlyGrowth = maxDailyGrowth / 8; // Changed from /24 to /8 for faster early growth
	const maxHourlyUsers = Math.max(
		website.users < 10 ? 3 : website.users < 100 ? 2 : 1, // Increased minimum hourly users
		Math.floor(website.users * maxHourlyGrowth),
	);
	newUsers = Math.min(newUsers, maxHourlyUsers);

	// Cap user growth based on server capacity
	const potentialNewTotal = website.users + newUsers;
	if (potentialNewTotal > website.server_costs.user_capacity) {
		newUsers = Math.max(0, website.server_costs.user_capacity - website.users);
	}

	website.users += newUsers;
	website.user_changes.net_change_today += newUsers;
	if (website.users > website.server_costs.user_capacity) {
		website.users = website.server_costs.user_capacity;
	}

	return website;
}

export function removeUsers(website: website): website {
	// Calculate users to remove based on retention
	// We want to lose (1 - retention) users over 45 days instead of 30
	const hourlyLossRate = (1 - website.retention) / (15 * 8);

	// Add some randomness to the loss rate (±10%)
	const randomizedLossRate = hourlyLossRate * (0.9 + Math.random() * 0.2);

	// Calculate base users to remove
	let usersToRemove = Math.floor(website.users * randomizedLossRate);

	// Add protection against massive losses
	// No more than 1.5% of userbase can be lost per day (changed from 2%)
	const maxDailyLoss = Math.floor(website.users * 0.015);
	const maxHourlyLoss = Math.floor(maxDailyLoss / 8);
	usersToRemove = Math.min(usersToRemove, maxHourlyLoss);

	// Additional protection: retention score reduces losses
	const retentionProtection = Math.max(0.5, 1 - website.retention * 0.5);
	usersToRemove = Math.floor(usersToRemove * retentionProtection);

	// Ensure we don't remove more users than we have
	usersToRemove = Math.min(usersToRemove, website.users);

	website.users = Math.round(Math.max(0, website.users - usersToRemove));
	website.user_changes.net_change_today -= usersToRemove;

	return website;
}

export function getMaxXPForHiring(website: website): number {
	return website.users > 100000
		? 10000
		: website.users > 10000
		? 7500
		: website.users > 1000
		? 5000
		: website.users > 500
		? 2500
		: 1500;
}

export function getHighestScore(website: website): number {
	return Math.max(...Object.values(website.scores));
}

// Helper function to ensure scores never go below 0
export function normalizeWebsiteScores(
	scores: website['scores'],
): website['scores'] {
	return {
		reliability: Math.max(0, scores.reliability),
		performance: Math.max(0, scores.performance),
		easeOfUse: Math.max(0, scores.easeOfUse),
		functionality: Math.max(0, scores.functionality),
		attractiveness: Math.max(0, scores.attractiveness),
		security: Math.max(0, scores.security),
		virality: Math.max(0, scores.virality),
	};
}

export function recalculateWebsiteScores(website: website): website {
	// First, reset all scores to account only for completed projects
	website.scores = website.projects
		.map(migrateProjectRecord)
		.filter((pr) => pr.completed && pr.enabled)
		.reduce(
			(scores, pr) => {
				Object.entries(pr.project.scores).forEach(([key, value]) => {
					scores[key as keyof typeof scores] += value;
				});
				return scores;
			},
			{
				reliability: 0,
				performance: 0,
				easeOfUse: 0,
				functionality: 0,
				attractiveness: 0,
				security: 0,
				virality: 0,
			},
		);

	return website;
}

export function makeEmployeeHappy(
	employee: employee,
	website: website,
	cost: number,
): employee {
	if (cost > website.money) {
		alert('Not enough money to make employee happy');
		return employee;
	}
	employee.happiness = 100;
	website.money -= cost;
	return employee;
}

export function getUserCapacity(
	website: website,
	weekly_spend: number,
): number {
	const totalWebsiteScores: number = Object.values(website.scores).reduce(
		(sum, val) => sum + val,
		0,
	);

	if (totalWebsiteScores === 0) {
		return 0;
	}

	// Calculate base capacity from weekly spend using a logarithmic scale
	// This creates diminishing returns as spending increases
	const baseCapacity = Math.log10(weekly_spend + 1) * 500;

	// Calculate performance ratio (between 0.1 and 2.0)
	// High performance and reliability with reasonable functionality is ideal
	const performanceRatio = Math.min(
		2.0,
		Math.max(
			0.1,
			((website.scores.reliability + website.scores.performance) /
				Math.max(1, website.scores.functionality)) *
				0.5,
		),
	);

	// Calculate final capacity with performance scaling
	let capacity = Math.round(baseCapacity * performanceRatio);

	// Apply minimum capacity based on weekly spend
	const minimumCapacity = weekly_spend * 15;
	capacity = Math.max(capacity, minimumCapacity);

	// Cap maximum capacity at 50 million users
	const maxCapacity = 50_000_000;
	capacity = Math.min(capacity, maxCapacity);

	// Ensure capacity is never negative
	return Math.max(0, capacity);
}

export function calculateProjectRevenue(
	project: projectRecord,
	website: website,
): number {
	const migratedProject = migrateProjectRecord(project);
	if (!migratedProject.completed || !migratedProject.enabled) return 0;

	// The higher the total score, and the higher the banner ad cost is (relative to the max), the more users will pay to remove ads.
	// This is a simple model that assumes that the more users are willing to pay, the more users will pay.
	const totalScores = Object.values(website.scores).reduce(
		(sum, val) => sum + val,
		0,
	);

	// Calculate base willingness to pay based on site quality
	const baseWillingnessToPay = Math.min(totalScores, 2000) / 2000;

	// Calculate price sensitivity for ad-free - higher price means fewer users willing to pay
	const adFreePriceSensitivity =
		1 -
		((website.monetization_config?.ad_free_revenue_per_user_per_week ??
			MONETIZATION_LIMITS.AD_FREE.DEFAULT) -
			MONETIZATION_LIMITS.AD_FREE.MIN) /
			(MONETIZATION_LIMITS.AD_FREE.MAX - MONETIZATION_LIMITS.AD_FREE.MIN);

	// More users will pay for ad-free if banner ads are aggressive (high cost)
	const bannerAdAggression = website.monetization_config
		? website.monetization_config.banner_ad_revenue_per_user_per_week /
		  MONETIZATION_LIMITS.BANNER_ADS.MAX
		: 0;

	// Calculate final percentage that will pay for ad-free
	let percentThatPayForAdFree =
		baseWillingnessToPay *
		adFreePriceSensitivity *
		(0.3 + bannerAdAggression * 0.9) *
		0.15;

	// check if the site has ad free project completed
	const adFreeProject = website.projects.find(
		(p) => p.project.name === PROJECT_NAME.AD_FREE && p.completed,
	);
	if (!adFreeProject) {
		percentThatPayForAdFree = 0;
	}

	// Add debug logging for Ad-Free calculations
	console.log('Ad-Free Revenue Debug:', {
		totalScores,
		baseWillingness: baseWillingnessToPay,
		priceSensitivity: adFreePriceSensitivity,
		bannerAdAggression,
		finalPercentage: percentThatPayForAdFree,
		activeUsers: website.users,
		retention: website.retention,
		weeklyRevenue:
			website.users *
			website.retention *
			percentThatPayForAdFree *
			(website.monetization_config?.ad_free_revenue_per_user_per_week ??
				MONETIZATION_LIMITS.AD_FREE.DEFAULT),
	});

	// Calculate Super Heart adoption rate with price sensitivity
	const superHeartPriceSensitivity =
		1 -
		((website.monetization_config?.super_heart_revenue_per_user_per_week ??
			MONETIZATION_LIMITS.SUPER_HEART.DEFAULT) -
			MONETIZATION_LIMITS.SUPER_HEART.MIN) /
			(MONETIZATION_LIMITS.SUPER_HEART.MAX -
				MONETIZATION_LIMITS.SUPER_HEART.MIN);

	const percentThatPayForSuperHeart =
		baseWillingnessToPay * superHeartPriceSensitivity * website.retention;

	const activeUsers = website.users;
	const config = website.monetization_config || monetizationConfig;

	switch (project.project.name) {
		case PROJECT_NAME.BANNER_ADS:
			// Calculate users who see ads (total users minus ad-free users)
			const usersWhoSeeAds = website.users * (1 - percentThatPayForAdFree);
			const weeklyBannerRevenue =
				usersWhoSeeAds *
				config.banner_ad_revenue_per_user_per_week *
				website.retention;

			console.log('Banner Ad Revenue Calculation:', {
				totalUsers: website.users,
				usersWhoSeeAds,
				revenuePerUserPerWeek: config.banner_ad_revenue_per_user_per_week,
				weeklyRevenue: weeklyBannerRevenue,
				monetizationConfig: config,
			});
			return weeklyBannerRevenue;
		case PROJECT_NAME.SUPER_HEART:
			// These features only work on retained users who are willing to pay
			return (
				activeUsers *
				website.retention *
				percentThatPayForSuperHeart *
				config.super_heart_revenue_per_user_per_week
			);
		case PROJECT_NAME.AD_FREE:
			// These features only work on retained users who are willing to pay
			return (
				activeUsers *
				website.retention *
				percentThatPayForAdFree *
				config.ad_free_revenue_per_user_per_week
			);
		default:
			return 0;
	}
}

export function canUndoProject(
	projectName: PROJECT_NAME,
	website: website,
): boolean {
	// Check if any completed projects depend on this one
	const completedProjects = website.projects.filter((pr) => pr.completed);

	for (const project of completedProjects) {
		if (project.project.dependencies?.includes(projectName)) {
			return false; // Can't undo if other projects depend on it
		}
	}

	return true;
}

export function undoProject(
	projectName: PROJECT_NAME,
	website: website,
): website {
	// Check if project can be undone
	if (!canUndoProject(projectName, website)) {
		console.log('Cannot undo project - other projects depend on it');
		return website;
	}

	// Find the project record
	const projectIndex = website.projects.findIndex(
		(pr) => pr.project.name === projectName,
	);
	if (projectIndex === -1) return website;

	const project = website.projects[projectIndex];
	if (!project.completed) return website;

	// Remove the project from the website's projects
	website.projects.splice(projectIndex, 1);

	// Remove any employees assigned to this project
	project.assignees.forEach((assigneeId) => {
		const employee = website.employees.find((e) => e.id === assigneeId);
		if (employee) {
			// Reduce employee XP by their contributions to this project
			employee.xp = Math.max(0, employee.xp - employee.contributions);
			employee.contributions = 0;
		}
	});

	// Recalculate website scores
	website = recalculateWebsiteScores(website);

	// If this was a monetization project, revenue will automatically stop since
	// the project is no longer in the completed projects list

	return website;
}

const investmentNameStarters = [
	'Horizon',
	'Silicon',
	'Digital',
	'Tech',
	'Millennium',
	'Pacific',
	'Gateway',
	'Cyber',
	'Future',
	'American',
	'Pioneer',
	'Global',
	'Micro',
	'Info',
];

const investmentNameMiddles = [
	'Valley',
	'Frontier',
	'Growth',
	'Innovation',
	'Systems',
	'Wave',
	'Tech',
];

const investmentNameEnders = [
	'Ventures',
	'Capital',
	'Partners',
	'Fund',
	'Associates',
	'Investments',
	'Group',
	'LLC',
];

export function generateInvestmentFirmName(): string {
	const starter =
		investmentNameStarters[
			Math.floor(Math.random() * investmentNameStarters.length)
		];
	// 40% chance to include a middle name
	const includeMiddle = Math.random() < 0.4;
	const middle = includeMiddle
		? ' ' +
		  investmentNameMiddles[
				Math.floor(Math.random() * investmentNameMiddles.length)
		  ]
		: '';
	const ender =
		' ' +
		investmentNameEnders[
			Math.floor(Math.random() * investmentNameEnders.length)
		];

	return starter + middle + ender;
}
