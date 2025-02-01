<script lang="ts">
	// @ts-ignore
	import { g, projectsPopupOpen } from './lib/store';
	import Prompt from './lib/Prompt.svelte';
	import HiringPopup from './lib/HiringPopup.svelte';
	import ProjectSearch from './lib/ProjectSearch.svelte';
	import { JOB_TYPE, type project } from './lib/objects/types';
	import {
		getJobColor,
		numberToMoney,
		numberWithCommas,
		startProject,
	} from './lib/utils';
	import EmployeeTile from './lib/EmployeeTile.svelte';
	import {
		hiringPopupOpen,
		projectSearchPopupOpen,
		promptOpen,
	} from './lib/store';
	import { onMount } from 'svelte';
	import { startGameLoop } from './lib/gameLoop';

	let inGameTime = '';
	$: inGameTime = `${$g.tick + 9}:00`;

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
		g.update((g) => ({
			...g,
			website: {
				id: Math.floor(Math.random() * 1000000) + 1000000,
				name: websiteName,
				day: 0,
				money: 100000,
				employees: [],
				users: 0,
				retention: 1,
				projects: [],
				scores: {
					reliability: 0,
					performance: 0,
					easeOfUse: 0,
					functionality: 0,
					attractiveness: 0,
					security: 0,
					virality: 0,
				},
			},
		}));
	}

	function createNewWebsite() {
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
				<button on:click={createNewWebsite} class="btn btn-primary px-8 py-2">
					Start your website
				</button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="stats-panel border-2 border-[var(--color-crt)] p-4">
				<h2 class="title text-xl mb-2">{activeWebsite.name}</h2>
				<div class="flex flex-col mb-4">
					<h2 class="text-2xl flex flex-row justify-between">
						<span>Users right now</span>
						<span> {activeWebsite.users}</span>
					</h2>
					<h2 class="text-2xl flex flex-row justify-between">
						<span>Retention</span>
						<span> {(activeWebsite.retention * 100).toFixed(2)}%</span>
					</h2>
				</div>
				<div class="grid grid-cols-2 gap-2 mb-4">
					<div>Day: {activeWebsite.day} - {inGameTime}</div>
					<div>Money: {numberToMoney(activeWebsite.money)}</div>
					<div>
						Engineers: {activeWebsite.employees.filter(
							(e) => e.job === JOB_TYPE.ENGINEERING,
						).length}
					</div>
					<div>
						Product: {activeWebsite.employees.filter(
							(e) => e.job === JOB_TYPE.PRODUCT,
						).length}
					</div>
					<div>
						Designers: {activeWebsite.employees.filter(
							(e) => e.job === JOB_TYPE.DESIGN,
						).length}
					</div>
					<div>
						Growth: {activeWebsite.employees.filter(
							(e) => e.job === JOB_TYPE.GROWTH,
						).length}
					</div>
				</div>
				<div class="border-t-2 border-[var(--color-crt)] pt-4">
					<h3 class="text-2xl mb-2">Website Scores</h3>
					<div class="flex flex-col gap-2">
						{#each Object.entries(activeWebsite.scores).sort((a, b) => b[1] - a[1]) as [score, value]}
							<div class="flex justify-between">
								<span class="capitalize">{score}:</span>
								<span class="text-[var(--color-crt)]">{Math.floor(value)}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
			<div class="action-panel border-2 border-[var(--color-crt)] p-4">
				<h2 class="title text-xl mb-4">Actions</h2>
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
