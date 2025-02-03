import {
	JOB_TYPE,
	PROJECT_NAME,
	type employee,
	type project,
	type projectRecord,
	type website,
} from './objects/types';
import { projects } from './objects/projects';
import { monetizationConfig } from './objects/monetization';
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

export function getJobColor(job: JOB_TYPE) {
	let color = 'cursor-pointer text-white px-2 py-1 ';
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
	// Get list of completed project names from the website's projects
	const completedProjectNames = new Set(
		website.projects.filter((pr) => pr.completed).map((pr) => pr.project.name),
	);

	// Get list of in-progress project names
	const inProgressProjectNames = new Set(
		website.projects.filter((pr) => !pr.completed).map((pr) => pr.project.name),
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

export function startProject(project: project, website: website) {
	// Update the game state through the store
	g.update((g) => {
		if (!g.website) return g;
		return {
			...g,
			website: {
				...g.website,
				projects: [
					...g.website.projects,
					{
						project,
						costs_remaining: { ...project.costs },
						assignees: [] as number[],
						completed: false,
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
		// This function is called weekly and adjusts the employees happiness. Every employee slowly loses happiness,
		// but if the employee is assigned to a project, they gain happiness slowly too.
		if (!getAvailableEmployees(website).includes(employee)) {
			employee.happiness -= Math.round(Math.random() * 2);
		}

		employee.happiness = Math.floor(
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

export function getEmployeeContributionScore(employee: employee): number {
	return (employee.xp * (employee.happiness / 150)) / 40 / 40;
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
					const baseXpGain = contribution * 20;

					// Apply diminishing returns based on current XP
					// As XP approaches 10000, gains become smaller
					const currentXp = website.employees[employeeIndex].xp;
					const xpMultiplier = Math.max(0.05, 1 - currentXp / 8000);

					// Add the scaled XP gain
					const actualXpGain = Math.floor(baseXpGain * xpMultiplier);
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

export function removeUsers(website: website): website {
	const users = website.users;

	// Calculate total website value
	const totalWebsiteValue = Object.values(website.scores).reduce(
		(sum, val) => sum + val,
		0,
	);

	// Calculate retention penalty based on total website value
	let retentionPenalty = 1.0;
	if (totalWebsiteValue < 100) {
		retentionPenalty = 0.8; // 20% penalty for very basic sites
	} else if (totalWebsiteValue < 500) {
		retentionPenalty = 0.9; // 10% penalty for developing sites
	}

	// Get effective retention (base retention * penalty)
	const effectiveRetention = website.retention * retentionPenalty;

	// We want to lose (1 - retention) of our users over a week
	// So each hour (tick) we should lose:
	// (1 - retention) / (24 * 7) of our current users
	const hourlyLossRate = (1 - effectiveRetention) / 56;

	// Calculate users lost this tick
	const lostUsers = Math.floor(users * hourlyLossRate);

	website.users = Math.max(0, users - lostUsers);
	website.user_changes.net_change_today -= lostUsers;

	// Log retention info for debugging
	console.log('Retention info:', {
		totalWebsiteValue: totalWebsiteValue.toFixed(1),
		retentionPenalty: retentionPenalty.toFixed(2),
		baseRetention: website.retention.toFixed(2),
		effectiveRetention: effectiveRetention.toFixed(2),
		hourlyLossRate: hourlyLossRate.toFixed(3),
		lostUsers,
		remainingUsers: website.users,
	});

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

export function addUsers(website: website): website {
	// Calculate total impact scores from completed projects
	let impacts = {
		reliability: 0,
		performance: 0,
		easeOfUse: 0,
		functionality: 0,
		attractiveness: 0,
		security: 0,
		virality: 0,
	};

	for (let project of website.projects) {
		if (project.completed) {
			impacts.reliability += project.project.scores.reliability;
			impacts.performance += project.project.scores.performance;
			impacts.easeOfUse += project.project.scores.easeOfUse;
			impacts.functionality += project.project.scores.functionality;
			impacts.attractiveness += project.project.scores.attractiveness;
			impacts.security += project.project.scores.security;
			impacts.virality += project.project.scores.virality;
		}
	}

	// Calculate total impact for organic growth
	const totalImpact = Object.values(impacts).reduce((sum, val) => sum + val, 0);
	if (totalImpact == 0) {
		return website;
	}

	// Calculate ratio for retention (excluding virality)
	const retentionScores = {
		reliability: impacts.reliability,
		performance: impacts.performance,
		easeOfUse: impacts.easeOfUse,
		functionality: impacts.functionality,
		attractiveness: impacts.attractiveness,
		security: impacts.security,
	};

	// Get non-zero scores to avoid division by zero
	const nonZeroScores = Object.values(retentionScores).filter((v) => v > 0);
	if (nonZeroScores.length === 0) {
		website.retention = 0;
	} else {
		const min = Math.min(...nonZeroScores);
		const max = Math.max(...nonZeroScores);
		website.retention = (min * 1.05) / max; // Store as decimal between 0 and 1
		if (website.retention > 1) {
			website.retention = 1;
		} else if (website.retention < 0) {
			website.retention = 0;
		}
	}

	// Find newspaper ads project if it exists and is completed
	const newspaperAds = website.projects.find(
		(p) => p.project.name === PROJECT_NAME.NEWSPAPER_ADS && p.completed,
	);

	// Calculate ad boost based on weekly spend (scaled down for more frequent updates)
	let adBoost = 1;
	if (newspaperAds?.rules.weekly_ad_spend) {
		// More modest scaling:
		// $500 = 1.1x boost
		// $2500 = 1.3x boost
		// $5000 = 1.5x boost
		// $7500 = 1.7x boost
		// $10000 = 1.9x boost
		const spendAmount = newspaperAds.rules.weekly_ad_spend;
		adBoost = 1 + spendAmount / 12500; // Linear scaling but more modest

		// Small base boost for having ads
		adBoost += newspaperAds.rules.weekly_ad_spend > 0 ? 0.1 : 0;
	}

	// Base organic growth now heavily depends on total impact
	// With 100 total impact: ~2-3 users per tick
	// With 200 total impact: ~4-6 users per tick
	// With 500 total impact: ~10-15 users per tick
	const baseOrganicGrowth = (Math.random() * Math.sqrt(totalImpact)) / 4;

	// Viral coefficient scales with virality but is more modest
	// Each 20 points of virality adds 0.05 to coefficient (max 1.25 at 100 virality)
	const viralCoefficient = 1 + Math.min(0.25, impacts.virality / 400);

	// Impact multiplier now more heavily weights total impact vs virality
	const impactMultiplier = 1 + Math.log10(Math.max(1, totalImpact)) / 10;

	// Calculate growth from existing users (with more modest caps)
	const maxViralGrowth = Math.min(
		website.users * 0.02, // Cap viral growth at 2% of current users per tick
		Math.max(
			0,
			website.users *
				(viralCoefficient - 1) *
				impactMultiplier *
				(0.95 + Math.random() * 0.1),
		),
	);

	// Random fluctuation is smaller and scales with total impact
	const randomFluctuation =
		totalImpact > 0
			? ((Math.random() * 2 - 1) * Math.sqrt(totalImpact)) / 10
			: 0;

	// Add all growth sources
	let newUsers = Math.floor(
		baseOrganicGrowth + maxViralGrowth + randomFluctuation,
	);

	// Small chance of a traffic spike (3% chance, size based on total impact)
	const hadSpike = Math.random() < 0.03;
	let spikeSize = 0;
	if (hadSpike) {
		spikeSize = Math.floor(
			Math.max(
				2,
				Math.sqrt(totalImpact) *
					(0.5 + Math.random()) *
					(1 + impacts.virality / 200),
			),
		);
		newUsers += spikeSize;
	}

	// Apply ad boost to ALL sources of growth
	newUsers = Math.floor(newUsers * adBoost);

	// Ensure some minimal growth with good scores
	if (totalImpact > 150 && newUsers === 0) {
		newUsers = 1;
	}

	// Cap user growth based on server capacity
	const potentialNewTotal = website.users + newUsers;
	if (potentialNewTotal > website.server_costs.user_capacity) {
		newUsers = Math.max(0, website.server_costs.user_capacity - website.users);
	}

	console.log('User changes:', {
		organic: baseOrganicGrowth.toFixed(2),
		adBoost: adBoost.toFixed(2),
		viralGrowth: maxViralGrowth.toFixed(2),
		randomFluctuation: randomFluctuation.toFixed(2),
		spike: spikeSize,
		total: newUsers,
		adSpend: newspaperAds?.rules.weekly_ad_spend,
		retention: website.retention.toFixed(2),
		viralCoefficient: viralCoefficient.toFixed(3),
		impactMultiplier: impactMultiplier.toFixed(2),
		totalImpact,
		viralityScore: impacts.virality,
		serverCapacity: website.server_costs.user_capacity,
	});

	website.users = Math.max(0, website.users + newUsers);
	website.user_changes.net_change_today += newUsers;

	return website;
}

export function processContinuousProjects(website: website): website {
	// First, reset all scores to account only for non-continuous projects
	website.scores = website.projects
		.filter((pr) => !pr.project.is_continuous && pr.completed)
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

	// Then process each completed continuous project
	website.projects
		.filter((pr) => pr.project.is_continuous && pr.completed)
		.forEach((pr) => {
			// Check if project has required roles filled
			const hasRequiredRoles = pr.project.required_roles
				? Object.entries(pr.project.required_roles).every(([role, count]) => {
						const assignedEmployeesOfRole = pr.assignees
							.map((id) => website.employees.find((e) => e.id === id))
							.filter((e) => e && e.job === role).length;
						return assignedEmployeesOfRole >= count;
				  })
				: true;

			if (hasRequiredRoles && pr.project.target_score) {
				// Calculate total productivity of assigned employees
				const totalProductivity = pr.assignees
					.map((id) => website.employees.find((e) => e.id === id))
					.filter((e) => e !== undefined)
					.reduce((sum, employee) => {
						if (!employee) return sum;
						return sum + (employee.xp * (employee.happiness / 200)) / 40;
					}, 0);

				// Apply productivity boost to target score
				// Base boost of 1 point per 10 productivity
				let boost = totalProductivity / 1000;

				// For newspaper ads, scale the boost based on weekly spend
				if (pr.project.name === PROJECT_NAME.NEWSPAPER_ADS) {
					// Add base virality score from the project
					website.scores.virality += pr.project.scores.virality;

					if (pr.rules.weekly_ad_spend) {
						// Scale from 500 to 10000 maps to 1x to 5x multiplier
						const spendMultiplier = 1 + (pr.rules.weekly_ad_spend - 500) / 2375;
						boost *= spendMultiplier;
					}
				}

				website.scores[pr.project.target_score] += boost;
			}
		});

	return website;
}

export function recalculateWebsiteScores(website: website): website {
	// First reset all scores to 0
	website.scores = {
		reliability: 0,
		performance: 0,
		easeOfUse: 0,
		functionality: 0,
		attractiveness: 0,
		security: 0,
		virality: 0,
	};

	// Add scores from all completed non-continuous projects
	website.projects
		.filter((pr) => !pr.project.is_continuous && pr.completed)
		.forEach((pr) => {
			Object.entries(pr.project.scores).forEach(([key, value]) => {
				website.scores[key as keyof typeof website.scores] += value;
			});
		});

	// Process continuous projects and their boosts
	website.projects
		.filter((pr) => pr.project.is_continuous && pr.completed)
		.forEach((pr) => {
			// First add base scores if any
			Object.entries(pr.project.scores).forEach(([key, value]) => {
				website.scores[key as keyof typeof website.scores] += value;
			});

			// Then check if project has required roles filled for continuous effects
			const hasRequiredRoles = pr.project.required_roles
				? Object.entries(pr.project.required_roles).every(([role, count]) => {
						const assignedEmployeesOfRole = pr.assignees
							.map((id) => website.employees.find((e) => e.id === id))
							.filter((e) => e && e.job === role).length;
						return assignedEmployeesOfRole >= count;
				  })
				: true;

			if (hasRequiredRoles && pr.project.target_score) {
				// Calculate total productivity of assigned employees
				const totalProductivity = pr.assignees
					.map((id) => website.employees.find((e) => e.id === id))
					.filter((e) => e !== undefined)
					.reduce((sum, employee) => {
						if (!employee) return sum;
						return sum + (employee.xp * (employee.happiness / 200)) / 40;
					}, 0);

				// Apply productivity boost to target score
				let boost = totalProductivity / 1000;

				// Special handling for newspaper ads
				if (
					pr.project.name === PROJECT_NAME.NEWSPAPER_ADS &&
					pr.rules.weekly_ad_spend
				) {
					const spendMultiplier = 1 + (pr.rules.weekly_ad_spend - 500) / 2375;
					boost *= spendMultiplier;
				}

				website.scores[pr.project.target_score] += boost;
			}
		});

	// Ensure no score goes below 0
	Object.keys(website.scores).forEach((key) => {
		if (website.scores[key as keyof typeof website.scores] < 0) {
			website.scores[key as keyof typeof website.scores] = 0;
		}
	});

	return website;
}

function dailyChanges(site: website) {
	site.day++;

	const initialMoney = site.money;

	// Apply retention loss daily
	site = removeUsers(site);

	// Initialize history arrays if they don't exist
	if (!site.user_changes.daily_history) {
		site.user_changes.daily_history = [];
	}
	if (!site.profit_changes.daily_history) {
		site.profit_changes.daily_history = [];
	}

	// Add today's changes to history
	site.user_changes.daily_history.push(site.user_changes.net_change_today);
	site.profit_changes.daily_history.push(site.profit_changes.net_change_today);

	// Keep only last 7 days
	if (site.user_changes.daily_history.length > 7) {
		site.user_changes.daily_history.shift();
	}
	if (site.profit_changes.daily_history.length > 7) {
		site.profit_changes.daily_history.shift();
	}

	// Calculate true rolling averages
	site.user_changes.rolling_average =
		site.user_changes.daily_history.reduce((sum, val) => sum + val, 0) /
		site.user_changes.daily_history.length;

	site.profit_changes.rolling_average =
		site.profit_changes.daily_history.reduce((sum, val) => sum + val, 0) /
		site.profit_changes.daily_history.length;

	console.log('Daily summary:', {
		netChangeToday: site.user_changes.net_change_today,
		rollingAverage: site.user_changes.rolling_average,
		history: site.user_changes.daily_history,
		totalUsers: site.users,
		netProfitToday: site.profit_changes.net_change_today,
		profitRollingAverage: site.profit_changes.rolling_average,
		profitHistory: site.profit_changes.daily_history,
		totalMoney: site.money,
	});

	// Reset daily counters but keep the rolling averages and history
	site.user_changes.net_change_today = 0;
	site.profit_changes.net_change_today = 0;

	return site;
}

function calculateProjectRevenue(
	project: projectRecord,
	website: website,
): number {
	if (!project.completed) return 0;

	const payingUserPercentage = getPayingUserPercentage(website);
	const activeUsers = website.users * website.retention;

	switch (project.project.name) {
		case PROJECT_NAME.BANNER_ADS:
			return (
				activeUsers * monetizationConfig.banner_ad_revenue_per_user_per_week
			);
		case PROJECT_NAME.SUPER_HEART:
			return (
				activeUsers *
				payingUserPercentage *
				monetizationConfig.super_heart_revenue_per_user_per_week
			);
		case PROJECT_NAME.AD_FREE:
			return (
				activeUsers *
				payingUserPercentage *
				monetizationConfig.ad_free_revenue_per_user_per_week
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
