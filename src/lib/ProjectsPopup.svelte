<script lang="ts">
	// @ts-ignore
	import { g, hiringPopupOpen, projectsPopupOpen } from './store';
	import { getAvailableProjects } from './utils';
	import { JOB_TYPE, type project } from './objects/types';
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	const dispatch = createEventDispatcher();

	let availableProjects: project[] = [];
	let jobsWeNeed: string = '';

	function handleCancel() {
		dispatch('cancel');
		isOpen = false;
	}

	// Update available projects when the game state changes
	$: if ($g.website) {
		availableProjects = getAvailableProjects($g.website);
	}

	function startProject(project: project) {
		// TODO: Implement project starting logic
		console.log('Starting project:', project.name);
		dispatch('submit', project);
	}

	// fucntion bool that says if you can start a project
	// you can only start a project if you have the job type hired
	function hasRequiredJobTypes(project: project): boolean {
		// Get the current website's employees
		const employees = $g.website?.employees || [];

		// Create a Set of all job types the website has hired
		const hiredJobTypes = new Set(employees.map((e) => e.job));

		// Array to store missing job types
		const missingJobs: string[] = [];

		// Check each job type and add to missingJobs if needed
		if (project.costs.product > 0 && !hiredJobTypes.has(JOB_TYPE.PRODUCT))
			missingJobs.push('Product');
		if (
			project.costs.engineering > 0 &&
			!hiredJobTypes.has(JOB_TYPE.ENGINEERING)
		)
			missingJobs.push('Engineering');
		if (project.costs.design > 0 && !hiredJobTypes.has(JOB_TYPE.DESIGN))
			missingJobs.push('Design');
		if (project.costs.growth > 0 && !hiredJobTypes.has(JOB_TYPE.GROWTH))
			missingJobs.push('Growth');

		// Update jobsWeNeed string
		if (missingJobs.length === 1) {
			jobsWeNeed = missingJobs[0];
		} else if (missingJobs.length > 1) {
			jobsWeNeed = missingJobs.join(', ');
		} else {
			jobsWeNeed = '';
		}

		return missingJobs.length === 0;
	}
</script>

{#if isOpen}
	<div class="modal modal-open">
		<div class="modal-box max-w-[90vw]">
			<h3 class="title text-2xl mb-6">Available Projects</h3>
			<div class="projects-list max-h-[75vh] overflow-y-auto">
				{#if availableProjects.length === 0}
					<div class="text-center py-8">
						<p class="text-xl">No projects available.</p>
					</div>
				{:else}
					<table class="w-full">
						<thead>
							<tr class="border-b-2 border-[var(--color-crt)]">
								<th class="text-left p-4 text-xl">Project</th>
								<th class="text-left p-4 text-xl w-[15%]">Type</th>
								<th class="text-left p-4 text-xl w-[15%]">Resources</th>
								<th class="text-left p-4 text-xl w-[15%]">Impact</th>
								<th class="p-4"></th>
							</tr>
						</thead>
						<tbody>
							{#each availableProjects as project}
								<tr class="border-b border-[var(--color-crt)]">
									<td class="p-4">
										<div class="text-xl font-bold mb-2">{project.name}</div>
										<div class="text-lg opacity-80">{project.requirements}</div>
									</td>
									<td class="p-4">
										<div
											class="inline-block border-2 border-[var(--color-crt)] rounded px-3 py-1 text-[var(--color-crt)]"
										>
											{project.feature}
										</div>
									</td>
									<td class="p-4">
										<div class="space-y-1">
											{#if project.costs.product > 0}
												<div class="text-lg">
													Product: <span class="text-[var(--color-crt)]"
														>{project.costs.product}</span
													>
												</div>
											{/if}
											{#if project.costs.engineering > 0}
												<div class="text-lg">
													Engineering: <span class="text-[var(--color-crt)]"
														>{project.costs.engineering}</span
													>
												</div>
											{/if}
											{#if project.costs.design > 0}
												<div class="text-lg">
													Design: <span class="text-[var(--color-crt)]"
														>{project.costs.design}</span
													>
												</div>
											{/if}
											{#if project.costs.growth > 0}
												<div class="text-lg">
													Growth: <span class="text-[var(--color-crt)]"
														>{project.costs.growth}</span
													>
												</div>
											{/if}
										</div>
									</td>
									<td class="p-4">
										<div class="space-y-1">
											{#if project.scores.reliability > 0}
												<div class="text-lg">
													Reliability <span class="text-[var(--color-crt)]"
														>+{project.scores.reliability}</span
													>
												</div>
											{/if}
											{#if project.scores.performance > 0}
												<div class="text-lg">
													Performance <span class="text-[var(--color-crt)]"
														>+{project.scores.performance}</span
													>
												</div>
											{/if}
											{#if project.scores.easeOfUse > 0}
												<div class="text-lg">
													Ease of Use <span class="text-[var(--color-crt)]"
														>+{project.scores.easeOfUse}</span
													>
												</div>
											{/if}
											{#if project.scores.functionality > 0}
												<div class="text-lg">
													Functionality <span class="text-[var(--color-crt)]"
														>+{project.scores.functionality}</span
													>
												</div>
											{/if}
											{#if project.scores.attractiveness > 0}
												<div class="text-lg">
													Attractiveness <span class="text-[var(--color-crt)]"
														>+{project.scores.attractiveness}</span
													>
												</div>
											{/if}
											{#if project.scores.security > 0}
												<div class="text-lg">
													Security <span class="text-[var(--color-crt)]"
														>+{project.scores.security}</span
													>
												</div>
											{/if}
										</div>
									</td>
									<td class="p-4">
										<button
											class="btn btn-md text-lg w-max {hasRequiredJobTypes(
												project,
											)
												? ''
												: 'text-opacity-100 bg-opacity- text-red-500 hover:bg-black'}"
											style={!hasRequiredJobTypes(project)
												? 'color:white;border-color:red;'
												: ''}
											on:click={() => {
												if (hasRequiredJobTypes(project)) {
													startProject(project);
												} else {
													$projectsPopupOpen = false;
													$hiringPopupOpen = true;
												}
											}}
										>
											{#if hasRequiredJobTypes(project)}
												Start project
											{:else}
												You need {jobsWeNeed}
											{/if}
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
			<div class="modal-action">
				<button class="btn btn-lg" on:click={handleCancel}>Close</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-box {
		background: var(--color-terminal);
	}

	.projects-list {
		scrollbar-width: thin;
		scrollbar-color: var(--color-crt) var(--color-terminal);
	}

	.projects-list::-webkit-scrollbar {
		width: 8px;
	}

	.projects-list::-webkit-scrollbar-track {
		background: var(--color-terminal);
	}

	.projects-list::-webkit-scrollbar-thumb {
		background-color: var(--color-crt);
		border: 2px solid var(--color-terminal);
	}

	/* Table styles */
	table {
		border-collapse: separate;
		border-spacing: 0;
	}

	th {
		background: rgba(0, 0, 0, 0.3);
		font-weight: normal;
		color: var(--color-crt);
	}

	tr:hover {
		background: rgba(0, 0, 0, 0.3);
	}
</style>
