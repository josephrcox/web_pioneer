import { writable } from 'svelte/store';
import type { game, employee } from './objects/types';

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

g.subscribe((value) => {
	localStorage.setItem('game', JSON.stringify(value));
});
