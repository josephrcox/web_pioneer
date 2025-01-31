import type { website } from './objects/types';
import { g } from './store';

// A day in game should be about a minute in real time.
// Update should happen 3 times every hour, so 3000 ms per update.
const ms_per_update = 3000;
const updates_per_day = 8;
let tick = 0;

export function startGameLoop() {
	setInterval(() => {
		g.update((game) => {
			tick++;
			if (!game.website) return game;

			let site = game.website;
			if (tick % updates_per_day === 0) {
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

function dailyChanges(site: website) {
	site.day++;
	return site;
}

function weeklyChanges(site: website) {
	// Iterate over each employee and pay them based on their salary
	site.employees.forEach((employee) => {
		site.money -= employee.salary;
	});
	return site;
}
