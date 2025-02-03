import { writable } from 'svelte/store';
import type { game, employee } from './objects/types';

const DEFAULT_SERVER_COSTS = {
	weekly_spend: 50,
	user_capacity: 2000, // 50 * 40
};

export const g = writable<game>(
	localStorage.getItem('game')
		? JSON.parse(localStorage.getItem('game') as string)
		: {
				id: Math.floor(Math.random() * 1000000),
				website: null,
				tick: 0,
		  },
);

export const candidates = writable<employee[]>([]);

// Popup states
export const hiringPopupOpen = writable<boolean>(false);
export const projectSearchPopupOpen = writable<boolean>(false);
export const projectsPopupOpen = writable<boolean>(false);
export const promptOpen = writable<boolean>(false);
export const paused = writable<boolean>(false);

g.subscribe((value) => {
	localStorage.setItem('game', JSON.stringify(value));
});

// When creating a new website, initialize with default server costs
export function createNewWebsite(name: string): game {
	return {
		id: Math.floor(Math.random() * 1000000),
		website: {
			id: Math.floor(Math.random() * 1000000),
			name,
			day: 0,
			money: 100000,
			users: 0,
			retention: 0,
			server_costs: { ...DEFAULT_SERVER_COSTS },
			user_changes: {
				net_change_today: 0,
				rolling_average: 0,
				daily_history: [],
			},
			profit_changes: {
				net_change_today: 0,
				rolling_average: 0,
				daily_history: [],
			},
			scores: {
				reliability: 0,
				performance: 0,
				easeOfUse: 0,
				functionality: 0,
				attractiveness: 0,
				security: 0,
				virality: 0,
			},
			employees: [],
			projects: [],
		},
		tick: 0,
	};
}
