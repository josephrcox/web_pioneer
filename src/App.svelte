<script lang="ts">
	// @ts-ignore
	import {
		g,
		projectsPopupOpen,
		hiringPopupOpen,
		projectSearchPopupOpen,
		promptOpen,
	} from './lib/store';
	import { createNewWebsite as initNewWebsite } from './lib/store';
	import Prompt from './lib/Prompt.svelte';
	import HiringPopup from './lib/HiringPopup.svelte';
	import ProjectSearch from './lib/ProjectSearch.svelte';
	import { JOB_TYPE, type project, PROJECT_NAME } from './lib/objects/types';
	import {
		getHighestScore,
		getJobColor,
		numberToMoney,
		numberWithCommas,
		startProject,
	} from './lib/utils';
	import EmployeeTile from './lib/EmployeeTile.svelte';
	import { onMount } from 'svelte';
	import { startGameLoop } from './lib/gameLoop';

	let inGameTime = '';
	$: inGameTime = `${$g.tick + 9 < 13 ? $g.tick + 9 : $g.tick + 9 - 12}${
		$g.tick + 9 < 12 ? 'AM' : 'PM'
	}`;

	function clearLocalStorage() {
		localStorage.clear();
		window.location.reload();
	}

	function clearProjects() {
		g.update((g) => {
			if (!g.website) return g;
			return {
				...g,
				website: {
					...g.website,
					projects: [],
				},
			};
		});
	}

	function handlePromptSubmit(event: CustomEvent<string>) {
		const websiteName = event.detail;
		$promptOpen = false;
		const newGame = initNewWebsite(websiteName);
		g.set(newGame);
	}

	function openNewWebsitePrompt() {
		$promptOpen = true;
	}

	function handleHire(event: CustomEvent<any[]>) {
		// The HiringPopup component now handles the state update
		$hiringPopupOpen = false;
	}

	function handleStartProject(event: CustomEvent<project>) {
		const chosenProject = event.detail;
		startProject(chosenProject, $g.website);
	}

	$: activeWebsite = $g.website;

	onMount(() => {
		startGameLoop();
	});
</script>

<main class="container mx-auto p-4 min-h-screen">
	<header class="mb-8 text-center">
		<h1 class="title text-2xl mb-4">Web Pioneer</h1>
		<p class="text-xl">Year: 1995 - The Dawn of the World Wide Web</p>
	</header>

	<div class="relative">
		<div class="fixed top-4 right-4 flex gap-2">
			<button
				on:click={clearProjects}
				class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md text-sm z-50"
			>
				Clear Projects (Debug)
			</button>
			<button
				on:click={clearLocalStorage}
				class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm z-50"
			>
				Clear Data (Debug)
			</button>
		</div>
	</div>

	{#if !activeWebsite}
		<div class="flex flex-col items-center justify-center space-y-4">
			<div class="title text-xl mb-4">Welcome, Future Web Pioneer!</div>
			<p class="max-w-md text-center mb-4">
				The internet is young, and the world is in need of some innovation.
			</p>
			{#if !$g.website}
				<button
					on:click={openNewWebsitePrompt}
					class="btn btn-primary px-8 py-2"
				>
					Start your website
				</button>
			{/if}
		</div>
	{:else}
		<div class="flex flex-row gap-4 w-full">
			<div class="flex-1 stats-panel border-2 border-[var(--color-crt)] p-4">
				<div class="flex flex-row justify-between">
					<h2 class="title text-xl mb-2">{activeWebsite.name}</h2>
					<p class="text-white opacity-50">
						Day: {activeWebsite.day} - {inGameTime}
					</p>
				</div>
				<div class="flex flex-row w-full justify-evenly">
					<div class="stat">
						<div class="stat-title text-white">Users</div>
						<div class="stat-value">
							{numberWithCommas($g.website?.users ?? 0)}
						</div>
						{#if $g.website?.user_changes}
							<div class="stat-desc flex flex-col gap-1">
								<span
									class={$g.website.user_changes.rolling_average >= 0
										? 'text-[var(--color-crt)]'
										: 'text-red-500'}
								>
									{$g.website.user_changes.rolling_average >= 0
										? '+'
										: ''}{numberWithCommas(
										Math.round($g.website.user_changes.rolling_average),
									)} per day
								</span>
								<span class="opacity-70 text-xs">
									≈{numberWithCommas(
										Math.round($g.website.user_changes.rolling_average * 7),
									)} per week
								</span>
							</div>
						{/if}
					</div>
					<div class="stat">
						<div class="stat-title text-white">Money</div>
						<div class="stat-value">
							{#if ($g.website?.money ?? 0) < 0}
								<span class="text-red-500">-</span>
							{/if}
							<span class="text-[var(--color-crt)]">$</span>
							{numberWithCommas(Math.abs(Math.floor($g.website?.money ?? 0)))}
						</div>
						{#if $g.website?.profit_changes}
							<div class="stat-desc flex flex-col gap-1">
								<span
									class={$g.website.profit_changes.rolling_average >= 0
										? 'text-[var(--color-crt)]'
										: 'text-red-500'}
								>
									{$g.website.profit_changes.rolling_average >= 0
										? '+'
										: ''}{numberToMoney(
										Math.round($g.website.profit_changes.rolling_average),
									)} per day
								</span>
								<span class="opacity-70 text-xs">
									≈{numberToMoney(
										Math.round($g.website.profit_changes.rolling_average * 7),
									)} per week
								</span>
							</div>
						{/if}
					</div>
					<div class="stat">
						<div class="stat-title text-white">Retention</div>
						<div class="stat-value">
							{Math.round(($g.website?.retention ?? 0) * 100)}%
						</div>
					</div>
				</div>
				<div class="my-4">
					<div class="flex flex-row gap-2 mb-4">
						<!-- List each job type with color -->
						{#each Object.values(JOB_TYPE) as job}
							<div class="text-white px-2 {getJobColor(job)}">{job}</div>
						{/each}
					</div>
					<div class="grid grid-cols-10 gap-1 max-w-96">
						{#each activeWebsite.employees as e}
							<EmployeeTile {e} />
						{/each}
					</div>
				</div>
				<div class=" pt-4">
					<div class="flex flex-col gap-3">
						{#each Object.entries(activeWebsite.scores).sort((a, b) => b[1] - a[1]) as [score, value]}
							<div class="w-full">
								<div class="flex justify-between mb-1">
									<span class="capitalize font-medium">{score}</span>
									<span class="text-[var(--color-crt)]"
										>{Math.floor(value)}</span
									>
								</div>
								<progress
									class="progress progress-accent w-full"
									value={Math.floor(value)}
									max={getHighestScore(activeWebsite)}
								/>
							</div>
						{/each}
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-4 w-[300px]">
				<div
					class="border-2 border-[var(--color-crt)] p-4 rounded-lg bg-black/30"
				>
					<h3 class="text-xl font-bold mb-4">Game Rules</h3>

					<div class="mb-6">
						<div class="font-bold mb-2">Server Costs:</div>
						<input
							type="range"
							min="50"
							max="10000"
							value={$g.website?.server_costs.weekly_spend ?? 50}
							step="50"
							class="range range-primary range-sm"
							on:change={(e) => {
								const target = e.currentTarget;
								g.update((g) => {
									if (!g.website) return g;
									const weekly_spend = parseInt(target.value);
									return {
										...g,
										website: {
											...g.website,
											server_costs: {
												weekly_spend,
												user_capacity: weekly_spend * 40,
											},
										},
									};
								});
							}}
						/>
						<div class="w-full flex justify-between text-xs px-2 mt-1">
							<span>$50</span>
							<span>$10,000</span>
						</div>
						<div class="text-center mt-1">
							${$g.website?.server_costs.weekly_spend?.toLocaleString() ??
								'50'}/week
						</div>
						<div class="text-sm mt-2 opacity-80">
							Server Capacity: {$g.website?.server_costs.user_capacity?.toLocaleString() ??
								'2,000'} users
							<br />
							<span class="text-xs">(Capacity = Weekly Cost × 40)</span>
						</div>
					</div>

					{#if $g.website?.projects.find((p) => p.project.name === PROJECT_NAME.NEWSPAPER_ADS && p.completed)}
						{@const newspaperProject = $g.website.projects.find(
							(p) => p.project.name === PROJECT_NAME.NEWSPAPER_ADS,
						)}
						<div>
							<div class="font-bold mb-2">Weekly Ad Spend:</div>
							<input
								type="range"
								min="0"
								max="10000"
								value={newspaperProject?.rules?.weekly_ad_spend ?? 500}
								step="100"
								class="range range-primary range-sm w-full"
								on:change={(e) => {
									const target = e.currentTarget;
									g.update((g) => {
										if (!g.website) return g;
										return {
											...g,
											website: {
												...g.website,
												projects: g.website.projects.map((p) =>
													p.project.name === PROJECT_NAME.NEWSPAPER_ADS
														? {
																...p,
																project: {
																	...p.project,
																	weekly_costs: {
																		money: parseInt(target.value),
																	},
																},
																rules: {
																	...p.rules,
																	weekly_ad_spend: parseInt(target.value),
																},
															}
														: p,
												),
											},
										};
									});
								}}
							/>
							<div class="w-full flex justify-between text-xs px-2 mt-1">
								<span>$500</span>
								<span>$10,000</span>
							</div>
							<div class="text-center mt-1">
								${newspaperProject?.rules?.weekly_ad_spend?.toLocaleString() ??
									'500'}
							</div>
						</div>
					{/if}
				</div>
				<div
					class="action-panel border-2 border-[var(--color-crt)] p-4 flex flex-col gap-4"
				>
					<button
						on:click={() => ($hiringPopupOpen = true)}
						class="btn btn-primary btn-lg px-8 py-2"
					>
						Hire Workers
					</button>
					<button
						on:click={() => ($projectSearchPopupOpen = true)}
						class="btn btn-primary btn-lg px-8 py-2"
					>
						Projects
					</button>
				</div>
			</div>
		</div>
	{/if}

	<Prompt
		prompt="Enter your website name"
		placeholder="WebGenius Inc."
		isOpen={$promptOpen}
		on:submit={handlePromptSubmit}
		on:cancel={() => ($promptOpen = false)}
	/>

	<HiringPopup
		isOpen={$hiringPopupOpen}
		on:submit={handleHire}
		on:cancel={() => ($hiringPopupOpen = false)}
	/>

	<ProjectSearch
		isOpen={$projectSearchPopupOpen}
		on:submit={handleStartProject}
		on:cancel={() => ($projectSearchPopupOpen = false)}
	/>
</main>

{JSON.stringify($g.website)}

<style>
	.stats-panel,
	.action-panel {
		background: rgba(0, 0, 0, 0.3);
	}
</style>
