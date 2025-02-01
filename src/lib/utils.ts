import {
	JOB_TYPE,
	PROJECT_NAME,
	type employee,
	type project,
	type projectRecord,
	type website,
} from './objects/types';
import { projects } from './objects/projects';
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

				if (pr.project.name === currentProject?.name) {
					// For current project: only make employee unavailable if their job still has work
					if (jobsWithRemainingWork.includes(employee.job)) {
						unavailableEmployeeIds.add(assigneeId);
					}
				} else {
					// For other projects: make employee unavailable if they're assigned and their job has work
					if (jobsWithRemainingWork.includes(employee.job)) {
						unavailableEmployeeIds.add(assigneeId);
					}
				}
			});
		});

	// Filter out employees who are unavailable
	const availableEmployees = employees.filter(
		(e) => !unavailableEmployeeIds.has(e.id),
	);

	// If we're looking at a specific project, filter out employees already assigned to it
	if (currentProjectRecord) {
		return availableEmployees.filter(
			(e) => !currentProjectRecord.assignees.includes(e.id),
		);
	}

	return availableEmployees;
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
		const productivityScore = (employee.xp * (employee.happiness / 200)) / 40;
		// For a user with 1000 xp, 0.5 happiness, this is 6.25 points per week.
		// Iterate over project costs
		for (const costType in project.costs_remaining) {
			if (costType === employee.job) {
				const contribution = productivityScore / 40;
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
		website.retention = min / max; // Store as decimal between 0 and 1
	}

	// Base organic growth (1-3 users per tick)
	const baseOrganicGrowth = Math.random() * 2 + 1;

	// Viral coefficient (between 1 and 1.05 based on virality score)
	const viralCoefficient = 1 + website.scores.virality / 1000;

	// Impact multiplier (slowly increases with total impact, but with diminishing returns)
	const totalImpact = Object.values(impacts).reduce((sum, val) => sum + val, 0);
	const impactMultiplier = 1 + Math.log10(Math.max(1, totalImpact)) / 10;

	// Calculate growth from existing users (with a cap)
	const maxViralGrowth = Math.min(
		website.users * 0.1, // Cap viral growth at 10% of current users
		website.users *
			(viralCoefficient - 1) *
			impactMultiplier *
			(0.95 + Math.random() * 0.1),
	);

	// Add organic growth and viral growth
	const newUsers = Math.floor(baseOrganicGrowth + maxViralGrowth);

	website.users = Math.max(0, website.users + newUsers);
	return website;
}

export function removeUsers(website: website): website {
	// retention is already a decimal between 0 and 1
	const users = website.users;
	// Between 0.95 and 1.05 - much less variance, and much less aggressive removal
	const randomMult = Math.random() * 0.1 + 0.95;
	// Only remove a portion of non-retained users
	const retentionRate = 0.7 + website.retention * 0.3; // This means even 0% retention keeps 70% of users
	website.users = Math.floor(users * retentionRate * randomMult);
	return website;
}

export function processContinuousProjects(website: website): website {
	// Process each completed continuous project
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
				const boost = totalProductivity / 1000;
				website.scores[pr.project.target_score] += boost;
			}
		});

	return website;
}
