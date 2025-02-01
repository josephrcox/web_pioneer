import type { projectRecord, website } from './objects/types';
import { g } from './store';
import {
	workOnProject,
	processContinuousProjects,
	addUsers,
	removeUsers,
	getPayingUserPercentage,
} from './utils';

// A day in game should be about a minute in real time.
// Update should happen 3 times every hour, so 3000 ms per update.
const ms_per_update = 1000;
const updates_per_day = 8;

export function startGameLoop() {
	setInterval(() => {
		g.update((game) => {
			game.tick = (game.tick + 1) % updates_per_day;
			if (!game.website) return game;
			let site = game.website;

			site = hourlyChanges(site);
			if (game.tick === 0) {
				site = dailyChanges(site);
				// Check for weekly changes based on the day count
				if (site.day % 7 === 0) {
					site = weeklyChanges(site);
				}
			}

			////////////////
			game.website = site;
			return game;
		});
	}, ms_per_update);
}

function hourlyChanges(site: website) {
	// Contribute to projects.
	let newProjects: projectRecord[] = [];
	site.projects.forEach((project) => {
		const [newProject, newSite] = workOnProject(project, site);
		newProjects.push(newProject);
		site = newSite;
	});
	site.projects = newProjects;

	// Fix scores by setting min to 0
	const scores = Object.entries(site.scores).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key]: Math.max(0, value),
		}),
		{ ...site.scores },
	);
	site.scores = scores;

	return site;
}

function dailyChanges(site: website) {
	site.day++;
	site = addUsers(site);
	return site;
}

function weeklyChanges(site: website) {
	// Process continuous projects first
	site = processContinuousProjects(site);

	// Only remove users every two weeks
	if (site.day % 14 === 0) {
		site = removeUsers(site);
	}

	// Pay employees
	site.employees.forEach((employee) => {
		site.money -= employee.salary;
	});

	// Pay weekly costs for continuous projects
	site.projects
		.filter((pr) => pr.project.is_continuous && pr.completed)
		.forEach((pr) => {
			if (pr.project.weekly_costs?.money) {
				site.money -= pr.project.weekly_costs.money;
			}
		});

	site.projects
		.filter((pr) => pr.completed)
		.forEach((pr) => {
			if (pr.project.weekly_revenue_per_user) {
				site.money +=
					pr.project.weekly_revenue_per_user *
					getPayingUserPercentage(site) *
					site.users;
			}
		});

	return site;
}
