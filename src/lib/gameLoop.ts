import type { projectRecord, website } from './objects/types';
import { g, hiringPopupOpen, paused } from './store';
import { get, writable } from 'svelte/store';
import {
	workOnProject,
	processContinuousProjects,
	addUsers,
	removeUsers,
	getPayingUserPercentage,
	recalculateWebsiteScores,
	adjustEmployeeHappiness,
} from './utils';

// A day in game should be about a minute in real time.
// Update should happen 3 times every hour, so 3000 ms per update.
const ms_per_update = 2000;
const updates_per_day = 8;

export function startGameLoop() {
	setInterval(() => {
		g.update((game) => {
			if (get(paused)) return game;
			game.tick = (game.tick + 1) % updates_per_day;
			if (!game.website) return game;
			let site = game.website;

			// Initialize user_changes and profit_changes if not present
			if (!site.user_changes) {
				site.user_changes = {
					net_change_today: 0,
					rolling_average: 0,
					daily_history: [],
				};
			}
			if (!site.profit_changes) {
				site.profit_changes = {
					net_change_today: 0,
					rolling_average: 0,
					daily_history: [],
				};
			}

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
	// Reset net change today if this is the first tick of the day
	if (get(g).tick === 0) {
		site.profit_changes.net_change_today = 0;
		site.user_changes.net_change_today = 0;
	}

	// Contribute to projects.
	let newProjects: projectRecord[] = [];
	site.projects.forEach((project) => {
		const [newProject, newSite] = workOnProject(project, site);
		newProjects.push(newProject);
		site = newSite;
	});
	site.projects = newProjects;

	// Apply hourly portion of weekly costs
	// There are 8 ticks per day * 7 days = 56 ticks per week
	const hourlyFraction = 1 / 56;

	// Pay hourly portion of employee salaries (weekly salary / 56 ticks)
	site.employees.forEach((employee) => {
		// Adjust salary for 1995 rates (roughly 40% of current value)
		const adjusted1995Salary = employee.salary * 0.4;
		const hourlyCost = adjusted1995Salary * hourlyFraction;
		site.money -= hourlyCost;
		site.profit_changes.net_change_today -= hourlyCost;
	});

	// Pay hourly portion of continuous project costs
	site.projects
		.filter((pr) => pr.project.is_continuous && pr.completed)
		.forEach((pr) => {
			if (pr.project.weekly_costs?.money) {
				const hourlyCost = pr.project.weekly_costs.money * hourlyFraction;
				site.money -= hourlyCost;
				site.profit_changes.net_change_today -= hourlyCost;
			}
		});

	// Pay hourly portion of server costs
	const hourlyServerCost = site.server_costs.weekly_spend * hourlyFraction;
	site.money -= hourlyServerCost;
	site.profit_changes.net_change_today -= hourlyServerCost;

	// Add hourly portion of weekly revenue
	site.projects
		.filter((pr) => pr.completed)
		.forEach((pr) => {
			if (pr.project.weekly_revenue_per_user) {
				const hourlyRevenue =
					pr.project.weekly_revenue_per_user *
					getPayingUserPercentage(site) *
					site.users *
					hourlyFraction;
				site.money += hourlyRevenue;
				site.profit_changes.net_change_today += hourlyRevenue;
			}
		});

	// 80% chance to process user changes each tick
	const initialUsers = site.users;
	if (Math.random() < 0.8) {
		site = addUsers(site);
	} else {
		site = removeUsers(site);
	}
	site.user_changes.net_change_today += site.users - initialUsers;

	// Recalculate all website scores
	site = recalculateWebsiteScores(site);

	return site;
}

function dailyChanges(site: website) {
	site.day++;

	const initialMoney = site.money;

	// Calculate rolling averages from today's net changes (after both gains and losses)
	site.user_changes.rolling_average =
		site.user_changes.rolling_average * 0.9 +
		site.user_changes.net_change_today * 0.1;

	site.profit_changes.rolling_average =
		site.profit_changes.rolling_average * 0.9 +
		site.profit_changes.net_change_today * 0.1;

	console.log('Daily summary:', {
		netChangeToday: site.user_changes.net_change_today,
		rollingAverage: site.user_changes.rolling_average,
		totalUsers: site.users,
		netProfitToday: site.profit_changes.net_change_today,
		profitRollingAverage: site.profit_changes.rolling_average,
		totalMoney: site.money,
	});

	// Reset daily counters but keep the rolling averages
	site.user_changes.net_change_today = 0;
	site.profit_changes.net_change_today = 0;

	return site;
}

function weeklyChanges(site: website) {
	const initialMoney = site.money;

	// Process continuous projects first
	site = processContinuousProjects(site);
	site = adjustEmployeeHappiness(site);

	// Reset weekly user change tracking while preserving history
	site.user_changes = {
		net_change_today: 0,
		rolling_average: site.user_changes.rolling_average,
		daily_history: site.user_changes.daily_history || [],
	};
	site.profit_changes = {
		net_change_today: 0,
		rolling_average: site.profit_changes.rolling_average,
		daily_history: site.profit_changes.daily_history || [],
	};

	// Track weekly profit changes
	site.profit_changes.net_change_today += site.money - initialMoney;

	return site;
}
