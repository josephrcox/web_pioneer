<!-- Svelte component that uses DaisyUI components to get input from the user -->

<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { JOB_TYPE, type employee } from './objects/types';
	// @ts-ignore
	import { candidates, g, paused } from './store';
	import {
		generateEmployeeName,
		getJobColor,
		getMaxXPForHiring,
		numberToMoney,
		numberWithCommas,
	} from './utils';

	export let isOpen = false;
	let isLoading = false;
	let searchTimeout: ReturnType<typeof setTimeout>;

	const dispatch = createEventDispatcher();

	function handleCancel() {
		if (isLoading) {
			clearTimeout(searchTimeout);
			isLoading = false;
		}
		dispatch('cancel');
		$paused = false;
		isOpen = false;
	}

	function handleHire(worker: employee) {
		// Iterate over employees, find the highest ID, and use the next one
		const highestId = $g.website.employees.reduce(
			(maxId, employee) => Math.max(maxId, employee.id),
			0,
		);

		const workerWithId = { ...worker, id: highestId + 1 };

		// Update the game state with the new worker and subtract their salary
		g.update((g) => {
			if (!g.website) return g;
			return {
				...g,
				website: {
					...g.website,
					money: g.website.money - worker.salary,
					employees: [...g.website.employees, workerWithId],
				},
			};
		});

		// Remove the worker from candidates
		candidates.update((c) => c.filter((w) => w.id !== worker.id));

		// Notify parent component
		dispatch('submit', [worker]);
	}

	function generateWorker(id: number): employee {
		const maxXP = getMaxXPForHiring($g.website);
		const minXP = 1000;

		let randomXp = Math.floor(Math.random() * (maxXP - minXP)) + minXP;

		// Base salary calculation using linear interpolation with some curve
		let baseSalary = 350 + ((randomXp - 1000) * (2000 - 350)) / (10000 - 1000);

		// Add more curve to the salary progression
		baseSalary = baseSalary * (0.7 + (randomXp / 10000) * 0.3);

		// Add randomness factor between 0.8 and 1.2 to simulate salary negotiation variations
		let randomFactor = 0.8 + Math.random() * 0.4;

		// Calculate final salary with randomness
		let randomSalary = Math.floor(baseSalary * randomFactor);

		let randomJob =
			Object.values(JOB_TYPE)[
				Math.floor(Math.random() * Object.keys(JOB_TYPE).length)
			];

		return {
			id,
			name: generateEmployeeName(),
			salary: randomSalary,
			xp: randomXp,
			job: randomJob,
			date_hired: 0,
			happiness: Math.floor(Math.random() * 75) + 25,
			contributions: 0,
		};
	}

	async function refreshCandidates() {
		if (isLoading) return;

		isLoading = true;

		// Random delay between 5-10 seconds
		const delay = Math.floor(Math.random() * 3000) + 1000;

		try {
			searchTimeout = setTimeout(() => {
				// Generate 3 new workers
				const newWorkers = Array(4)
					.fill(null)
					.map((_, i) => generateWorker(i + 1));

				// Replace existing candidates with new ones
				candidates.set(newWorkers);
				isLoading = false;
			}, delay);
		} catch (error) {
			console.error('Error generating candidates:', error);
			isLoading = false;
		}
	}

	onMount(() => {
		if (isOpen) {
			$paused = true;
		}
	});

	onDestroy(() => {
		$paused = false;
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
	});

	$: if (isOpen && $candidates.length === 0) {
		refreshCandidates();
	}
</script>

{#if isOpen}
	<div class="modal modal-open">
		<div class="modal-box min-w-[70%]">
			<h3 class="title text-xl mb-8">Available Candidates</h3>
			<p class="text-md opacity-75 mb-4">
				With your current users, you can hire employees up to {numberWithCommas(
					getMaxXPForHiring($g.website),
				)} XP.
			</p>
			<div class="candidates-container w-full overflow-x-auto">
				<div class="candidates-list grid grid-cols-2 gap-4 pb-4">
					{#if isLoading}
						<div
							class="flex flex-col items-center justify-center py-8 w-full col-span-2"
						>
							<div
								class="loading loading-dots loading-lg text-[var(--color-crt)]"
							></div>
							<p class="mt-4">Searching for candidates...</p>
							<p class="text-sm opacity-75">This will take 5-10 seconds</p>
						</div>
					{:else if $candidates.length === 0}
						<div class="text-center py-8 w-full col-span-2">
							<p>No candidates available.</p>
							<p class="text-sm opacity-75 mt-2">
								Click "Find More Candidates" to search
							</p>
						</div>
					{:else}
						{#each $candidates as worker (worker.id)}
							<div
								class="candidate-card border-2 border-[var(--color-crt)] p-3 flex flex-col justify-between"
							>
								<div class="grid grid-cols-2 gap-2 mb-3">
									<div class="col-span-2 text-2xl">{worker.name}</div>
									<div>
										Role: <span
											class="text-white px-2
											{getJobColor(worker.job)}
										">{worker.job}</span
										>
									</div>
									<div>
										XP: <span class="text-[var(--color-crt)]"
											>{numberWithCommas(worker.xp)} / 10,000</span
										>
									</div>
									<div>
										Weekly Salary: <span class="text-[var(--color-crt)]"
											>{numberToMoney(worker.salary)}</span
										>
									</div>
									<div>
										Happiness: <span class="text-[var(--color-crt)]"
											>{worker.happiness}%</span
										>
									</div>
								</div>
								<button
									class="btn btn-sm w-full
										{$g.website && $g.website.money >= worker.salary
										? 'btn-primary'
										: 'btn-disabled'}
									"
									on:click={() => handleHire(worker)}
								>
									Hire {worker.name}
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
			<div class="modal-action">
				<button
					class="btn btn-primary"
					on:click={refreshCandidates}
					disabled={isLoading}
				>
					{isLoading ? 'Searching...' : 'Find More Candidates'}
				</button>
				<button class="btn" on:click={handleCancel}>Close</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button on:click={handleCancel}>close</button>
		</form>
	</div>
{/if}

<style>
	.candidates-container {
		max-height: 24rem;
		scrollbar-width: thin;
		scrollbar-color: var(--color-crt) var(--color-terminal);
	}

	.candidates-container::-webkit-scrollbar {
		height: 8px;
		width: 8px;
	}

	.candidates-container::-webkit-scrollbar-track {
		background: var(--color-terminal);
	}

	.candidates-container::-webkit-scrollbar-thumb {
		background-color: var(--color-crt);
		border: 2px solid var(--color-terminal);
		border-radius: 4px;
	}

	.candidate-card {
		background: rgba(0, 0, 0, 0.3);
		flex-shrink: 0;
	}

	:global(.loading-dots) {
		--loading-color: var(--color-crt);
	}
</style>
