<script lang="ts">
	// @ts-ignore
	import { g, hiringPopupOpen, projectSearchPopupOpen } from './store';
	import {
		assignEmployee,
		getAvailableEmployees,
		getAvailableProjects,
		getJobColor,
		isProjectComplete,
		shipProject,
		canUndoProject,
		undoProject,
	} from './utils';
	import {
		JOB_TYPE,
		type project,
		type projectRecord,
		PROJECT_NAME,
		FEATURE,
	} from './objects/types';
	import { createEventDispatcher } from 'svelte';
	import EmployeeTile from './EmployeeTile.svelte';

	export let isOpen = false;
	const dispatch = createEventDispatcher();

	let availableProjects: project[] = [];
	let completedProjects: projectRecord[] = [];
	let ongoingProjects: projectRecord[] = [];
	let jobsWeNeed: string = '';

	let showAssignPopup: {
		show: boolean;
		project: project | null;
	} = {
		show: false,
		project: null,
	};

	let activeFilter: string | null = null;
	let activeFeatureFilter: FEATURE | null = null;
	let filteredProjects: project[] = [];

	// Reactive statement to update available projects when game state changes
	$: if ($g.website) {
		availableProjects = getAvailableProjects($g.website);
		completedProjects = $g.website.projects.filter((p) => p.completed);
		ongoingProjects = $g.website.projects.filter((p) => !p.completed);
	}

	// Separate reactive statement for filtering
	$: {
		// Start with available projects
		let filtered = availableProjects;

		// Apply feature filter if active
		if (activeFeatureFilter) {
			filtered = filtered.filter((p) => p.feature === activeFeatureFilter);
		}

		// Apply score filter if active
		if (activeFilter && isValidScoreKey(activeFilter)) {
			filtered = filtered.filter((p) => {
				const scoreImpact = p.scores[activeFilter as keyof typeof p.scores] > 0;
				const continuousImpact =
					p.is_continuous && p.target_score === activeFilter;
				return scoreImpact || continuousImpact;
			});
		}

		// Update filtered projects
		filteredProjects = filtered;
	}

	function handleCancel() {
		dispatch('cancel');
		isOpen = false;
	}

	function abandonProject(projectToAbandon: project) {
		g.update((g) => {
			if (!g.website) return g;
			return {
				...g,
				website: {
					...g.website,
					projects: g.website.projects.filter(
						(p) => p.project.name !== projectToAbandon.name,
					),
				},
			};
		});

		// Update local state
		if ($g.website) {
			availableProjects = getAvailableProjects($g.website);
			ongoingProjects = $g.website.projects.filter((p) => !p.completed);
		}
	}

	function startProject(project: project) {
		let projectToStart = { ...project };
		if (project.name === PROJECT_NAME.NEWSPAPER_ADS) {
			projectToStart = {
				...projectToStart,
				weekly_costs: {
					money: project.weekly_costs?.money ?? 500,
				},
			};
		}
		dispatch('submit', projectToStart);
	}

	// fucntion bool that says if you can start a project
	// you can only start a project if you have the job type hired
	function hasRequiredJobTypes(project: project): [boolean, string] {
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

		return [missingJobs.length === 0, jobsWeNeed];
	}

	function isValidScoreKey(key: string): key is keyof typeof $g.website.scores {
		return key in $g.website.scores;
	}

	function handleUndo(projectName: PROJECT_NAME) {
		g.update((g) => {
			if (!g.website) return g;
			return {
				...g,
				website: undoProject(projectName, g.website),
			};
		});
	}
</script>

{#if showAssignPopup.show}
	<div class="modal modal-open z-100">
		<div class="modal-box min-w-[50%] relative">
			<button
				class="btn btn-sm btn-circle absolute right-2 top-2"
				on:click={() => (showAssignPopup.show = false)}>✕</button
			>
			<h3 class="text-xl mb-8">
				Assign Employee to {showAssignPopup.project?.name}
			</h3>
			<div class="available-employees-container w-full overflow-y-auto">
				<div class="grid grid-cols-2 gap-4 pb-4">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					{#each getAvailableEmployees($g.website, showAssignPopup.project ?? undefined) as employee}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="employee-card border-2 border-[var(--color-crt)] p-3 flex items-center justify-between cursor-pointer hover:bg-black/30"
							on:click={() => {
								if (showAssignPopup.project) {
									assignEmployee($g.website, showAssignPopup.project, employee);
									g.update((g) => ({ ...g })); // Force UI update
									showAssignPopup.show = false;
								}
							}}
						>
							<div class="text-xl">{employee.name}</div>
							<div
								class="text-white px-2 py-1 {getJobColor(employee.job)} rounded"
							>
								{employee.job}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button on:click={() => (showAssignPopup.show = false)}>close</button>
		</form>
	</div>
{/if}

{#if isOpen}
	<div class="modal w-full modal-open z-50 overflow-y-auto">
		<div class="modal-box min-w-[90%] relative max-h-[90vh] overflow-y-auto">
			<div class="absolute right-2 top-2 flex gap-2">
				<button
					class="btn btn-sm btn-error"
					on:click={() => {
						const currentGame = $g;
						if (currentGame.website) {
							const updatedWebsite = {
								...currentGame.website,
								users: 0,
								money: 0,
							};
							g.set({
								...currentGame,
								website: updatedWebsite,
							});
						}
					}}
				>
					Reset Users
				</button>
				<button class="btn btn-sm btn-circle" on:click={handleCancel}>
					✕
				</button>
			</div>
			<h3 class="title text-xl mb-6">Projects</h3>
			<div class="projects-container w-full overflow-y-auto pr-10">
				<div
					class="sticky top-0 bg-black/90 pt-2 pb-4 mb-4 z-10 border-b border-[var(--color-crt)]"
				>
					<div class="flex flex-col gap-4 px-2 py-1">
						<!-- Feature filters -->
						<div class="flex flex-wrap gap-2">
							<span class="text-sm opacity-70 mr-2">Features:</span>
							{#each Object.values(FEATURE) as feature (feature)}
								<button
									class="px-3 py-1 rounded-full text-sm capitalize transition-all
										{activeFeatureFilter === feature
										? 'bg-[var(--color-crt)] text-black font-bold'
										: 'border border-[var(--color-crt)] text-[var(--color-crt)] hover:bg-[var(--color-crt)]/10'}"
									on:click={() => {
										if (activeFeatureFilter === feature) {
											activeFeatureFilter = null;
										} else {
											activeFeatureFilter = feature;
										}
									}}
								>
									{feature}
									{#if activeFeatureFilter === feature}
										<span class="ml-2">✕</span>
									{/if}
								</button>
							{/each}
						</div>

						<!-- Score filters -->
						<div class="flex flex-wrap gap-2">
							<span class="text-sm opacity-70 mr-2">Scores:</span>
							{#each Object.keys($g.website.scores) as score (score)}
								<button
									class="px-3 py-1 rounded-full text-sm capitalize transition-all
										{activeFilter === score
										? 'bg-[var(--color-crt)] text-black font-bold'
										: 'border border-[var(--color-crt)] text-[var(--color-crt)] hover:bg-[var(--color-crt)]/10'}"
									on:click={() => {
										if (activeFilter === score) {
											activeFilter = null;
										} else {
											activeFilter = score;
										}
									}}
								>
									{score}
									{#if activeFilter === score}
										<span class="ml-2">✕</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>

				{#if !activeFilter && !activeFeatureFilter}
					{#if ongoingProjects.length > 0}
						<h4 class="text-xl mb-4 text-[var(--color-crt)]">
							Ongoing Projects
						</h4>
						<div
							class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 overflow-y-auto"
						>
							{#each ongoingProjects as projectRecord}
								<div
									class="project-card border-2 border-[var(--color-crt)] p-4"
								>
									<div class="text-2xl font-bold mb-2">
										{projectRecord.project.name}
									</div>
									<div class="text-lg opacity-80 mb-4">
										{projectRecord.project.requirements}
									</div>
									<div class="flex flex-row justify-between">
										<div class="mb-4 max-w-[50%] mr-6">
											<h5 class="text-xl underline mb-2">Remaining Work</h5>
											<div class="gap-0 text-md">
												<ul class="list-disc ml-8 w-max space-y-2">
													{#if projectRecord.project.costs.product > 0}
														<li class="text-md">
															Product:
															{#if projectRecord.costs_remaining.product <= 0}
																<span class="text-green-500">✓</span>
																<span class="opacity-50"
																	>({projectRecord.project.costs.product.toFixed(
																		1,
																	)})</span
																>
															{:else}
																<span
																	class="text-[var(--color-crt)] {getJobColor(
																		JOB_TYPE.PRODUCT,
																	)}"
																	>{projectRecord.costs_remaining.product.toFixed(
																		1,
																	)}</span
																>
															{/if}
														</li>
													{/if}
													{#if projectRecord.project.costs.engineering > 0}
														<li class="text-md">
															Engineering:
															{#if projectRecord.costs_remaining.engineering <= 0}
																<span class="text-green-500">✓</span>
																<span class="opacity-50"
																	>({projectRecord.project.costs.engineering.toFixed(
																		1,
																	)})</span
																>
															{:else}
																<span
																	class="text-[var(--color-crt)] {getJobColor(
																		JOB_TYPE.ENGINEERING,
																	)}"
																	>{projectRecord.costs_remaining.engineering.toFixed(
																		1,
																	)}</span
																>
															{/if}
														</li>
													{/if}
													{#if projectRecord.project.costs.design > 0}
														<li class="text-md">
															Design:
															{#if projectRecord.costs_remaining.design <= 0}
																<span class="text-green-500">✓</span>
																<span class="opacity-50"
																	>({projectRecord.project.costs.design})</span
																>
															{:else}
																<span
																	class="text-[var(--color-crt)] {getJobColor(
																		JOB_TYPE.DESIGN,
																	)}"
																	>{projectRecord.costs_remaining.design.toFixed(
																		1,
																	)}</span
																>
															{/if}
														</li>
													{/if}
													{#if projectRecord.project.costs.growth > 0}
														<li class="text-md">
															Growth:
															{#if projectRecord.costs_remaining.growth <= 0}
																<span class="text-green-500">✓</span>
																<span class="opacity-50"
																	>({projectRecord.project.costs.growth})</span
																>
															{:else}
																<span
																	class="text-[var(--color-crt)] {getJobColor(
																		JOB_TYPE.GROWTH,
																	)}"
																	>{projectRecord.costs_remaining.growth.toFixed(
																		1,
																	)}</span
																>
															{/if}
														</li>
													{/if}
												</ul>
											</div>
										</div>
										<div>
											<h5 class="text-xl underline mb-2">Assignees</h5>
											<div
												class="flex flex-wrap gap-2 mb-4 max-w-[100%] whitespace-nowrap"
											>
												{#each projectRecord.assignees as employeeId}
													{#if $g.website}
														{@const foundEmployee = $g.website.employees.find(
															(e) => e.id === employeeId,
														)}
														{#if foundEmployee !== undefined}
															<EmployeeTile
																e={foundEmployee}
																displayName={true}
															/>
														{/if}
													{/if}
												{/each}
											</div>
										</div>
									</div>
									<div
										class="flex flex-col gap-2
									
									"
									>
										{#if !isProjectComplete(projectRecord)}
											<button
												class="btn btn-md btn-primary w-full"
												on:click={() => {
													showAssignPopup.project = projectRecord.project;
													showAssignPopup.show = true;
												}}
											>
												Assign Employee
											</button>
											<button
												class="btn btn-md btn-error w-full"
												on:click={() => abandonProject(projectRecord.project)}
											>
												Abandon Project
											</button>
										{:else}
											<button
												class="btn btn-md btn-accent w-full rainbow-btn"
												on:click={() => {
													if ($g.website) {
														const updatedProject = shipProject(projectRecord);
														g.update((g) => {
															// Update website scores when shipping a project
															const updatedScores = { ...g.website.scores };
															Object.entries(
																projectRecord.project.scores,
															).forEach(([key, value]) => {
																if (isValidScoreKey(key)) {
																	updatedScores[key] += value;
																}
															});

															// Iterate over assignees and make them happier
															for (let eid of projectRecord.assignees) {
																const employee = g.website.employees.find(
																	(e) => e.id === eid,
																);

																if (employee) {
																	// Junior employees get more happiness from projects.
																	const happinessChange = Math.round(
																		Math.random() *
																			5 *
																			((12000 - employee.xp) / 5000),
																	);
																	employee.happiness += happinessChange;
																}
															}

															return {
																...g,
																website: {
																	...g.website,
																	scores: updatedScores,
																	projects: g.website.projects.map((p) =>
																		p.project.name ===
																		projectRecord.project.name
																			? updatedProject
																			: p,
																	),
																},
															};
														});
													}
												}}
											>
												SHIP IT!
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if completedProjects.length > 0}
						<h4 class="text-xl mb-4 text-[var(--color-crt)]">
							Completed Projects
						</h4>
						<div class="grid grid-cols-4 gap-4 overflow-y-auto">
							{#each completedProjects as projectRecord}
								<div
									class="project-card border-2 border-[var(--color-crt)] p-4"
								>
									<div class="text-2xl font-bold mb-2">
										{projectRecord.project.name}
										{#if projectRecord.project.is_continuous}
											<span
												class="text-sm bg-blue-500 text-white px-2 py-1 rounded-full ml-2"
												>Continuous</span
											>
										{/if}
									</div>
									<div class="text-lg opacity-80">
										{projectRecord.project.requirements}
									</div>
									{#if projectRecord.project.name === PROJECT_NAME.NEWSPAPER_ADS}
										<div class="mt-4">
											<div class="font-bold mb-2">Weekly Ad Spend:</div>
											<input
												type="range"
												min="0"
												max="10000"
												value={projectRecord.project.weekly_costs?.money ?? 500}
												step="100"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														return {
															...g,
															website: {
																...g.website,
																projects: g.website.projects.map((p) =>
																	p.project.name === projectRecord.project.name
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
																					weekly_ad_spend: parseInt(
																						target.value,
																					),
																				},
																			}
																		: p,
																),
															},
														};
													});
												}}
											/>
											<div
												class="w-full flex justify-between text-xs px-2 mt-1"
											>
												<span>$500</span>
												<span>$10,000</span>
											</div>
											<div class="text-center mt-1">
												${projectRecord.project.weekly_costs?.money?.toLocaleString() ??
													'500'}
											</div>
										</div>
									{/if}
									{#if canUndoProject(projectRecord.project.name, $g.website)}
										<button
											class="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-sm mt-4"
											on:click={() => handleUndo(projectRecord.project.name)}
										>
											Undo
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/if}

				<h4 class="text-xl mb-4 text-[var(--color-crt)] mt-4">
					{activeFilter || activeFeatureFilter
						? 'Filtered Projects'
						: 'Available Projects'}
				</h4>
				{#if availableProjects.length === 0}
					<div class="text-center py-8">
						<p class="text-xl">No projects available.</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-4 overflow-y-auto">
						{#each filteredProjects as project}
							<div class="project-card border-2 border-[var(--color-crt)] p-4">
								<div class="flex flex-row gap-4">
									<div class="flex flex-col w-[40%]">
										<div class="text-3xl mb-2">
											{project.name}
											{#if project.is_continuous}
												<span
													class="text-sm bg-blue-500 text-white px-2 py-1 rounded-full ml-2"
													>Continuous</span
												>
											{/if}
										</div>
										<div class="text-lg opacity-80 mb-4">
											{project.requirements}
										</div>
										<div
											class="inline-block border-2 border-[var(--color-crt)] rounded px-3 py-1 text-[var(--color-crt)] w-max"
										>
											{project.feature}
										</div>
										{#if project.is_continuous}
											<div class="mt-4 text-sm">
												<div class="font-bold mb-2">Required Roles:</div>
												{#each Object.entries(project.required_roles || {}) as [role, count]}
													<div class="ml-2">• {count}x {role}</div>
												{/each}
												{#if project.name === PROJECT_NAME.NEWSPAPER_ADS}
													<div class="mt-4">
														<div class="font-bold mb-2">Weekly Ad Spend:</div>
														<input
															type="range"
															min="500"
															max="10000"
															value="500"
															step="100"
															class="range range-primary range-sm"
															on:change={function (e) {
																const target = e.currentTarget;
																project.weekly_costs = {
																	money: parseInt(target.value),
																};
															}}
														/>
														<div
															class="w-full flex justify-between text-xs px-2"
														>
															<span>$500</span>
															<span>$10,000</span>
														</div>
														<div class="text-center mt-1">
															${project.weekly_costs?.money?.toLocaleString() ??
																'500'}
														</div>
													</div>
												{:else if project.weekly_costs?.money}
													<div class="mt-2 font-bold">Weekly Cost:</div>
													<div class="ml-2">
														• ${project.weekly_costs.money.toLocaleString()}
													</div>
												{/if}
												<div class="mt-2 font-bold">Affects:</div>
												<div class="ml-2">• {project.target_score}</div>
											</div>
										{/if}
										<button
											class="btn mt-4 w-fit {!hasRequiredJobTypes(project)[0]
												? 'text-red-500 btn-error hover:text-[var(--color-crt)] hover:bg-red-800'
												: 'btn-primary'}"
											style={!hasRequiredJobTypes(project)[0]
												? 'border-color:red;background-color:red;color:white;'
												: ''}
											on:click={() => {
												if (hasRequiredJobTypes(project)[0]) {
													startProject(project);
													// clear all filters
													activeFilter = null;
													activeFeatureFilter = null;
												} else {
													$projectSearchPopupOpen = false;
													$hiringPopupOpen = true;
												}
											}}
										>
											{#if hasRequiredJobTypes(project)[0]}
												Start project
											{:else}
												You need: {hasRequiredJobTypes(project)[1]}
											{/if}
										</button>
									</div>
									<div class="w-[30%]">
										<h5 class="text-xl mb-2 underline">Setup Costs:</h5>
										<div>
											<ul class="list-disc ml-8 w-max space-y-3">
												{#if project.costs.product > 0}
													<li>
														Product: <span
															class="text-[var(--color-crt)] {getJobColor(
																JOB_TYPE.PRODUCT,
															)}">{project.costs.product.toFixed(1)}</span
														>
													</li>
												{/if}
												{#if project.costs.engineering > 0}
													<li>
														Engineering: <span
															class="text-[var(--color-crt)] {getJobColor(
																JOB_TYPE.ENGINEERING,
															)}">{project.costs.engineering.toFixed(1)}</span
														>
													</li>
												{/if}
												{#if project.costs.design > 0}
													<li>
														Design: <span
															class="text-[var(--color-crt)] {getJobColor(
																JOB_TYPE.DESIGN,
															)}">{project.costs.design.toFixed(1)}</span
														>
													</li>
												{/if}
												{#if project.costs.growth > 0}
													<li>
														Growth: <span
															class="text-[var(--color-crt)] {getJobColor(
																JOB_TYPE.GROWTH,
															)}">{project.costs.growth.toFixed(1)}</span
														>
													</li>
												{/if}
											</ul>
										</div>
									</div>
									<div class="w-[30%]">
										<h5 class="text-xl mb-2 underline">Initial Impact:</h5>
										<div class="space-y-1">
											{#if project.scores.reliability !== 0}
												<div>
													Reliability <span
														class={project.scores.reliability > 0
															? 'text-[var(--color-crt)]'
															: 'text-red-500'}
														>{project.scores.reliability > 0 ? '+' : ''}{project
															.scores.reliability}</span
													>
												</div>
											{/if}
											{#if project.scores.performance !== 0}
												<div>
													Performance <span
														class={project.scores.performance > 0
															? 'text-[var(--color-crt)]'
															: 'text-red-500'}
														>{project.scores.performance > 0 ? '+' : ''}{project
															.scores.performance}</span
													>
												</div>
											{/if}
											{#if project.scores.easeOfUse !== 0}
												<div>
													Ease of Use <span
														class={project.scores.easeOfUse > 0
															? 'text-[var(--color-crt)]'
															: 'text-red-500'}
														>{project.scores.easeOfUse > 0 ? '+' : ''}{project
															.scores.easeOfUse}</span
													>
												</div>
											{/if}
											{#if project.scores.functionality !== 0}
												<div>
													Functionality <span
														class={project.scores.functionality > 0
															? 'text-[var(--color-crt)]'
															: 'text-red-500'}
														>{project.scores.functionality > 0
															? '+'
															: ''}{project.scores.functionality}</span
													>
												</div>
											{/if}
											{#if project.scores.attractiveness !== 0}
												<div>
													Attractiveness <span
														class={project.scores.attractiveness > 0
															? 'text-[var(--color-crt)]'
															: 'text-red-500'}
														>{project.scores.attractiveness > 0
															? '+'
															: ''}{project.scores.attractiveness}</span
													>
												</div>
											{/if}
											{#if project.scores.security !== 0}
												<div>
													Security <span
														class={project.scores.security > 0
															? 'text-[var(--color-crt)]'
															: 'text-red-500'}
														>{project.scores.security > 0 ? '+' : ''}{project
															.scores.security}</span
													>
												</div>
											{/if}
											{#if project.scores.virality !== 0}
												<div>
													Virality <span
														class={project.scores.virality > 0
															? 'text-[var(--color-crt)]'
															: 'text-red-500'}
														>{project.scores.virality > 0 ? '+' : ''}{project
															.scores.virality}</span
													>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button on:click={handleCancel}>close</button>
		</form>
	</div>
{/if}

<style>
	.projects-container {
		max-height: 70vh;
		scrollbar-width: thin;
		scrollbar-color: var(--color-crt) var(--color-terminal);
	}

	.projects-container::-webkit-scrollbar {
		width: 8px;
	}

	.projects-container::-webkit-scrollbar-track {
		background: var(--color-terminal);
	}

	.projects-container::-webkit-scrollbar-thumb {
		background-color: var(--color-crt);
		border: 2px solid var(--color-terminal);
		border-radius: 4px;
	}

	.available-employees-container {
		max-height: 24rem;
		scrollbar-width: thin;
		scrollbar-color: var(--color-crt) var(--color-terminal);
	}

	.available-employees-container::-webkit-scrollbar {
		width: 8px;
	}

	.available-employees-container::-webkit-scrollbar-track {
		background: var(--color-terminal);
	}

	.available-employees-container::-webkit-scrollbar-thumb {
		background-color: var(--color-crt);
		border: 2px solid var(--color-terminal);
		border-radius: 4px;
	}

	.project-card {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		transition: all 0.2s ease-in-out;
	}

	.project-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.employee-card {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		transition: all 0.2s ease-in-out;
		opacity: 0.5;
	}

	.employee-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		opacity: 1;
	}

	@keyframes rainbow {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.rainbow-btn {
		background: linear-gradient(
			45deg,
			#ff0000,
			#ff7300,
			#fffb00,
			#48ff00,
			#00ffd5,
			#002bff,
			#7a00ff,
			#ff00c8,
			#ff0000
		);
		background-size: 400% 400%;
		animation: rainbow 3s ease infinite;
		border: none;
		color: white;
		text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
		font-weight: bold;
	}

	.rainbow-btn:hover {
		animation: rainbow 1s ease infinite;
		transform: scale(1.05);
		transition: transform 0.2s ease;
	}

	.sticky {
		position: sticky;
		backdrop-filter: blur(8px);
	}
</style>
