<script lang="ts">
	// @ts-ignore
	import { g } from './lib/store';
	import Prompt from './lib/Prompt.svelte';
	import HiringPopup from './lib/HiringPopup.svelte';
	import ProjectsPopup from './lib/ProjectsPopup.svelte';
	import { JOB_TYPE, type project } from './lib/objects/types';
	import { getJobColor, numberToMoney } from './lib/utils';
	import EmployeeTile from './lib/EmployeeTile.svelte';
	import { hiringPopupOpen, projectsPopupOpen, promptOpen } from './lib/store';
	import { onMount } from 'svelte';
	import { startGameLoop } from './lib/gameLoop';

	function clearLocalStorage() {
		localStorage.clear();
		window.location.reload();
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
				wau: 0,
				projects: [],
				scores: {
					reliability: 0,
					performance: 0,
					easeOfUse: 0,
					functionality: 0,
					attractiveness: 0,
					security: 0,
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
		$projectsPopupOpen = false;

		// First,
		alert(JSON.stringify(chosenProject));
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
		<button
			on:click={clearLocalStorage}
			class="fixed top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm z-50"
		>
			Clear Data (Debug)
		</button>
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
				<h2 class="title text-xl mb-4">{activeWebsite.name}</h2>
				<div class="grid grid-cols-2 gap-4">
					<div>Day: {activeWebsite.day}</div>
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
			</div>
			<div class="action-panel border-2 border-[var(--color-crt)] p-4">
				<h2 class="title text-xl mb-4">Actions</h2>
				<button
					on:click={() => ($hiringPopupOpen = true)}
					class="btn btn-primary px-8 py-2"
				>
					Hire Workers
				</button>
				<button
					on:click={() => ($projectsPopupOpen = true)}
					class="btn btn-primary px-8 py-2"
				>
					See Projects
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
			<div class="grid grid-cols-12 gap-1">
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

	<ProjectsPopup
		isOpen={$projectsPopupOpen}
		on:submit={handleStartProject}
		on:cancel={() => ($projectsPopupOpen = false)}
	/>
</main>

<style>
	.stats-panel,
	.action-panel {
		background: rgba(0, 0, 0, 0.3);
	}
</style>
