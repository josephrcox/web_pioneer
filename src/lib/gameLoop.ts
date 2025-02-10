import type { projectRecord, website, MarketingConfig } from './objects/types';
import { g, hiringPopupOpen, paused } from './store';
import { get, writable } from 'svelte/store';
import { PROJECT_NAME } from './objects/types';
import { MONETIZATION_LIMITS } from './objects/monetization';
import {
	workOnProject,
	addUsers,
	removeUsers,
	getPayingUserPercentage,
	recalculateWebsiteScores,
	adjustEmployeeHappiness,
	calculateProjectRevenue,
	getUserCapacity,
	getInvestmentOpportunities,
	normalizeWebsiteScores,
} from './utils';

// A day in game should be about a minute in real time.
// Update should happen 3 times every hour, so 3000 ms per update.
const ms_per_update = 1500;
const updates_per_day = 8;

// Add at the top with other constants
const HOURS_TO_TRACK = 2;

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
					investor_payout_today: 0,
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
	// Log initial state for this hour
	const initialMoney = site.money;
	console.log('=== Hourly Money Changes ===');
	console.log('Initial money:', initialMoney);

	// Process user changes
	site = addUsers(site);
	site = removeUsers(site);

	site.server_costs.user_capacity = getUserCapacity(
		site,
		site.server_costs.weekly_spend,
	);

	// Process ongoing projects
	site.projects.forEach((pr) => {
		if (!pr.completed) {
			const [updatedProject, updatedSite] = workOnProject(pr, site);
			site = updatedSite;
			// Update the project in the site's projects array
			site.projects = site.projects.map((p) =>
				p.project.name === updatedProject.project.name ? updatedProject : p,
			);
		}
	});

	// Recalculate website scores
	site = recalculateWebsiteScores(site);

	// Process monetization and costs
	let hourlyRevenue = 0;
	// First calculate revenue
	site.projects
		.filter((pr) => pr.completed && pr.enabled)
		.forEach((pr) => {
			const projectRevenue = calculateProjectRevenue(pr, site);
			console.log(`Revenue from ${pr.project.name}:`, projectRevenue);
			if (projectRevenue > 0) {
				const hourlyProjectRevenue = projectRevenue / 56; // Convert weekly to hourly
				hourlyRevenue += hourlyProjectRevenue;
				site.money += hourlyProjectRevenue;
				console.log(`Added hourly revenue for ${pr.project.name}:`, {
					weeklyRevenue: projectRevenue,
					hourlyRevenue: hourlyProjectRevenue,
					newTotalMoney: site.money,
				});
			}
		});
	console.log('Total revenue this hour:', hourlyRevenue);

	// Process costs
	let hourlySalaryCosts = 0;
	// Employee salaries (weekly to hourly)
	site.employees.forEach((employee) => {
		const hourlyCost = employee.salary / 56;
		hourlySalaryCosts += hourlyCost;
		site.money -= hourlyCost;
		console.log(
			`Employee ${employee.name} hourly cost: ${hourlyCost.toFixed(2)} (${
				employee.salary
			}/week)`,
		);
	});
	console.log('Total salary costs this hour:', hourlySalaryCosts);

	// Server costs (weekly to hourly)
	const hourlyServerCost = site.server_costs.weekly_spend / 56;
	site.money -= hourlyServerCost;
	console.log('Server costs this hour:', hourlyServerCost);

	// Process all projects with weekly costs
	console.log('=== Project Running Costs ===');
	site.projects
		.filter((p) => p.completed && p.enabled && p.project.weekly_costs?.money)
		.forEach((project) => {
			const weeklyCost = project.project.weekly_costs!.money;
			let hourlyCost = 0;
			hourlyCost = weeklyCost / 56;

			site.money -= hourlyCost;
			console.log(
				`${project.project.name} costs this hour: $${hourlyCost.toFixed(
					2,
				)} ($${weeklyCost}/week)`,
			);
		});

	// Process marketing costs for all active marketing campaigns
	console.log('=== Marketing Campaign Costs ===');
	const marketingProjects = [
		PROJECT_NAME.NEWSPAPER_ADS,
		PROJECT_NAME.TV_INFOMERCIAL,
		PROJECT_NAME.RADIO_ADS,
		PROJECT_NAME.COLLEGE_CAMPUS_CAMPAIGN,
	];

	marketingProjects.forEach((projectName) => {
		const marketingProject = site.projects.find(
			(p) => p.project.name === projectName && p.completed && p.enabled,
		);

		if (marketingProject) {
			const configKey = (projectName
				.toLowerCase()
				.replace(/\s+/g, '_')
				.replace('campaign', '')
				.replace('late_night_', '') + '_weekly_spend') as keyof MarketingConfig;

			const weeklySpend =
				site.marketing_config?.[configKey] ??
				marketingProject.rules?.weekly_ad_spend ??
				0;
			if (weeklySpend > 0) {
				const hourlyMarketingCost = weeklySpend / 56;
				site.money -= hourlyMarketingCost;
				console.log(
					`${projectName} marketing spend this hour: $${hourlyMarketingCost.toFixed(
						2,
					)} ($${weeklySpend}/week)`,
				);
			}
		}
	});

	// Calculate money changes for this hour
	const moneyChange = site.money - initialMoney;
	site.profit_changes.net_change_today += moneyChange;
	console.log('Total money change this hour:', moneyChange);
	console.log('Net change today so far:', site.profit_changes.net_change_today);
	console.log('Final money:', site.money);
	console.log('========================');

	// Process profit sharing with investors if we have any
	if (site.investors && site.investors.length > 0 && moneyChange > 1) {
		// Calculate profit to distribute (anything over $1)
		const profitToDistribute = moneyChange - 1;

		// Track total investor payout for this hour
		let totalInvestorPayout = 0;

		// Distribute profits to investors based on their ownership percentage
		site.investors.forEach((investor) => {
			const investorShare = profitToDistribute * (investor.percent_owned / 100);
			site.money -= investorShare;
			totalInvestorPayout += investorShare;
			console.log(
				`Distributed ${investorShare.toFixed(2)} to ${investor.firm} (${
					investor.percent_owned
				}%)`,
			);
		});

		// Add to daily history directly rather than accumulating
		const lastHistoryEntry =
			site.profit_changes.daily_history[
				site.profit_changes.daily_history.length - 1
			];
		if (lastHistoryEntry) {
			lastHistoryEntry.investors_paid += totalInvestorPayout;
		}

		// Log the final money after profit sharing
		console.log('Money after profit sharing:', site.money);
		console.log('Total paid to investors:', totalInvestorPayout);
	}

	return site;
}

function dailyChanges(site: website) {
	site.day++;

	// Calculate base retention from website scores
	const totalPossibleScore = 1000; // A reasonable target for a good website
	const scoreWeights = {
		reliability: 0.5, // 25% - Very important as it affects basic usability
		performance: 0.3, // 20% - Also critical for basic usability
		easeOfUse: 0.5, // 15% - Important for keeping users around
		functionality: 1, // 15% - Gives users reasons to stay
		attractiveness: 0.7, // 15% - Keeps users interested
		security: 0.5, // 10% - Important but less visible to users
		virality: 0, // 0% - Doesn't affect retention directly
	};

	// Calculate weighted retention score
	let retentionScore = 0;
	// Ensure we use normalized scores for retention calculation
	const normalizedScores = normalizeWebsiteScores(site.scores);
	Object.entries(scoreWeights).forEach(([score, weight]) => {
		const normalizedScore = Math.min(
			1,
			normalizedScores[score as keyof typeof site.scores] / totalPossibleScore,
		);
		retentionScore += normalizedScore * weight;
	});

	site.retention = 0.1 + retentionScore * 0.85;

	// Process retention loss from banner ads
	if (
		site.projects.find(
			(p) => p.project.name === 'Banner Ads' && p.completed && p.enabled,
		)
	) {
		if (site.monetization_config) {
			// Calculate retention penalty based on how aggressive the ads are
			const bannerAdCostOutOfMax =
				site.monetization_config.banner_ad_revenue_per_user_per_week /
				MONETIZATION_LIMITS.BANNER_ADS.MAX;
			// Scale the penalty to be less severe - max 30% reduction at highest ad rate
			const maxPenalty = 0.9;
			site.retention *= 1 - bannerAdCostOutOfMax * maxPenalty;
		}
	}

	// Calculate users to remove based on retention with better scaling
	const baseChurnRate = (1 - site.retention) / 30; // Spread over a month instead of a week
	const scalingFactor = Math.max(0.1, Math.min(1, Math.log10(site.users) / 6));
	const usersToRemove = Math.floor(site.users * baseChurnRate * scalingFactor);
	site.users = Math.max(0, site.users - usersToRemove);

	// Update history
	site.user_changes.daily_history.push({
		added: site.user_changes.net_change_today,
		removed: usersToRemove,
		day: site.day,
	});

	site.profit_changes.daily_history.push({
		gained: Math.max(0, site.profit_changes.net_change_today),
		spent: Math.abs(Math.min(0, site.profit_changes.net_change_today)),
		investors_paid: 0, // Initialize to 0, will be updated during hourly changes
		day: site.day,
	});

	// Keep only last 7 days of history
	if (site.user_changes.daily_history.length > 7) {
		site.user_changes.daily_history.shift();
	}
	if (site.profit_changes.daily_history.length > 7) {
		site.profit_changes.daily_history.shift();
	}

	// Calculate rolling averages from last 3 days
	const last3Days = site.user_changes.daily_history.slice(-3);
	if (last3Days.length > 0) {
		site.user_changes.rolling_average =
			last3Days.reduce((sum, day) => sum + day.added - day.removed, 0) /
			last3Days.length;
	}

	const last3DaysProfit = site.profit_changes.daily_history.slice(-3);
	if (last3DaysProfit.length > 0) {
		site.profit_changes.rolling_average =
			last3DaysProfit.reduce((sum, day) => sum + day.gained - day.spent, 0) /
			last3DaysProfit.length;

		// Calculate average investor payout from history
		site.profit_changes.investor_payout_today =
			last3DaysProfit.reduce((sum, day) => sum + day.investors_paid, 0) /
			last3DaysProfit.length;
	}

	// Reset daily counters
	site.user_changes.net_change_today = 0;
	site.profit_changes.net_change_today = 0;

	// Adjust employee happiness
	site = adjustEmployeeHappiness(site);

	return site;
}

function weeklyChanges(site: website): website {
	const initialMoney = site.money;

	// Reset weekly user change tracking while preserving history
	site.user_changes = {
		net_change_today: 0,
		rolling_average: site.user_changes.rolling_average,
		daily_history: site.user_changes.daily_history || [],
	};
	site.profit_changes = {
		net_change_today: 0,
		rolling_average: site.profit_changes.rolling_average,
		investor_payout_today: 0,
		daily_history: site.profit_changes.daily_history || [],
	};

	// Track weekly profit changes
	site.profit_changes.net_change_today += site.money - initialMoney;

	// Check for new investment opportunities
	const newOpportunities = getInvestmentOpportunities(site);
	site.investment_opportunities = [
		...site.investment_opportunities.filter((o) => o.expires > site.day), // Keep non-expired opportunities
		...newOpportunities,
	];

	return site;
}
