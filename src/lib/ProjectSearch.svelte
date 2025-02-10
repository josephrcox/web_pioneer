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
		migrateProjectRecord,
		isProjectEnabled,
		normalizeWebsiteScores,
	} from './utils';
	import {
		JOB_TYPE,
		type project,
		type projectRecord,
		PROJECT_NAME,
		FEATURE,
		type employee,
	} from './objects/types';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import EmployeeTile from './EmployeeTile.svelte';
	import { MONETIZATION_LIMITS } from './objects/monetization';
	import WebsiteScores from './WebsiteScores.svelte';
	import EmployeeModal from './EmployeeModal.svelte';

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
	type ProjectCategory = 'CORE' | 'BUGS' | 'MARKETING' | 'MONETIZATION' | 'UX';

	const PROJECT_CATEGORIES: Record<ProjectCategory, string> = {
		CORE: 'Core Features',
		BUGS: 'Bugs & Performance',
		MARKETING: 'Marketing & Growth',
		MONETIZATION: 'Monetization',
		UX: 'User Experience',
	};

	let activeCategory: ProjectCategory | null = 'CORE';

	let projectsSection: HTMLElement;
	let availableProjectsSection: HTMLElement;

	let employeeModalOpen = false;
	let selectedEmployee: employee = {
		id: -1,
		name: '',
		job: JOB_TYPE.ENGINEERING,
		xp: 0,
		date_hired: 0,
		happiness: 0,
		salary: 0,
		contributions: 0,
	};

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen && !showAssignPopup.show) {
			handleCancel();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});

	// Reactive statement to update available projects when game state changes
	$: if ($g.website) {
		console.log('All projects:', $g.website.projects);
		availableProjects = getAvailableProjects($g.website);
		completedProjects = $g.website.projects
			.map(migrateProjectRecord)
			.filter((p) => {
				console.log(
					'Checking project:',
					p.project.name,
					'completed:',
					p.completed,
				);
				return p.completed;
			});
		ongoingProjects = $g.website.projects
			.map(migrateProjectRecord)
			.filter((p) => !p.completed);
		console.log('Completed projects:', completedProjects);
	}

	// Helper function to determine project category
	function getProjectCategory(project: project): ProjectCategory {
		if (project.feature == FEATURE.CORE) {
			return 'CORE';
		}
		if (project.feature == FEATURE.BUGS) {
			return 'BUGS';
		}
		if (project.feature == FEATURE.MARKETING) {
			return 'MARKETING';
		}
		if (project.feature == FEATURE.MONETIZATION) {
			return 'MONETIZATION';
		}
		if (project.feature == FEATURE.UX) {
			return 'UX';
		}
		return 'CORE';
	}

	// Helper function to get available project count for a category
	function getProjectCountForCategory(category: string): number {
		if (!isValidCategory(category)) return 0;
		return getAvailableProjects($g.website).filter(
			(p) => getProjectCategory(p) === category,
		).length;
	}

	// Reactive statement to update project counts when available projects change
	$: {
		if ($g.website) {
			availableProjects = getAvailableProjects($g.website);
			completedProjects = $g.website.projects
				.map(migrateProjectRecord)
				.filter((p) => p.completed);
			ongoingProjects = $g.website.projects
				.map(migrateProjectRecord)
				.filter((p) => !p.completed);
		}
	}

	// Reactive statement for filtered projects
	$: {
		let filtered = getAvailableProjects($g.website);

		// First filter by category if selected
		if (activeCategory) {
			filtered = filtered.filter(
				(p) => getProjectCategory(p) === activeCategory,
			);
		}

		// Then apply feature filter if active
		if (activeFeatureFilter) {
			filtered = filtered.filter((p) => p.feature === activeFeatureFilter);
		}

		// Then apply score filter if active
		if (activeFilter && isValidScoreKey(activeFilter)) {
			filtered = filtered.filter((p) => {
				const scoreImpact = p.scores[activeFilter as keyof typeof p.scores] > 0;
				return scoreImpact;
			});
		}

		filteredProjects = filtered;
		availableProjects = getAvailableProjects($g.website);
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

	// Helper function to safely get category label
	function getCategoryLabel(category: string): string {
		return category in PROJECT_CATEGORIES
			? PROJECT_CATEGORIES[category as ProjectCategory]
			: 'Unknown Category';
	}

	// Helper function to safely set category
	function setCategory(category: string | null) {
		if (!category) {
			activeCategory = null;
			return;
		}
		if (category in PROJECT_CATEGORIES) {
			activeCategory = category as ProjectCategory;
		}
	}

	// Helper function to check if a string is a valid category
	function isValidCategory(category: string): category is ProjectCategory {
		return category in PROJECT_CATEGORIES;
	}

	function openEmployeeModal(e: employee) {
		selectedEmployee = e;
		employeeModalOpen = true;
	}

	function closeEmployeeModal() {
		employeeModalOpen = false;
	}
</script>

{#if showAssignPopup.show}
	<div class="modal modal-open z-100">
		<div class="modal-box min-w-[50%] h-[50%] relative">
			<button
				class="btn btn-sm btn-circle absolute right-2 top-2"
				on:click={() => (showAssignPopup.show = false)}>✕</button
			>
			<h3 class="text-xl mb-8 select-none">
				Assign Employee to {showAssignPopup.project?.name}
			</h3>
			{#if getAvailableEmployees($g.website, showAssignPopup.project ?? undefined).length > 0}
				<div class="available-employees-container w-full overflow-y-auto">
					<div class="grid grid-cols-2 gap-4 pb-4">
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						{#each getAvailableEmployees($g.website, showAssignPopup.project ?? undefined) as employee}
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								class="employee-card select-none border-2 border-[var(--color-crt)] p-3 flex items-center justify-between cursor-pointer hover:bg-black/30"
								on:click={() => {
									if (showAssignPopup.project) {
										assignEmployee(
											$g.website,
											showAssignPopup.project,
											employee,
										);
										g.update((g) => ({ ...g })); // Force UI update
										if (
											getAvailableEmployees($g.website, showAssignPopup.project)
												.length === 0
										) {
											showAssignPopup.show = false;
										}
									}
								}}
							>
								<div class="text-xl">{employee.name}</div>
								<div
									class="text-white px-2 py-1 {getJobColor(
										employee.job,
									)} rounded"
								>
									{employee.job}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="text-center text-lg">
					No employees available to assign to this project.
				</div>
				<!-- button to open hiring popup -->
				<button
					class="btn btn-primary w-full mt-4"
					on:click={() => {
						showAssignPopup.show = false;
						$hiringPopupOpen = true;
					}}>Hire Employees</button
				>
			{/if}
		</div>
		<form method="dialog" class="modal-backdrop">
			<button on:click={() => (showAssignPopup.show = false)}>close</button>
		</form>
	</div>
{/if}

{#if isOpen}
	<div class="fixed inset-0 z-50 bg-[var(--color-terminal)] overflow-y-auto">
		<div class="w-full h-full p-4">
			<div class="relative h-full">
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
				<div
					class="projects-container w-full overflow-y-auto pr-10 pb-24"
					bind:this={projectsSection}
				>
					<!-- Categories -->
					<div class="mb-8 sticky top-0 bg-[var(--color-terminal)] z-10">
						<h4 class="text-lg mb-4 opacity-1">Select Project Category:</h4>
						<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
							{#each Object.keys(PROJECT_CATEGORIES) as category}
								<button
									class="category-card border-2 border-[var(--color-crt)] p-2 rounded-lg text-center transition-all hover:bg-[var(--color-crt)]/10
										{activeCategory === category ? 'bg-[var(--color-crt)]' : 'opacity-50'}"
									on:click={() => {
										if (activeCategory === category) {
											setCategory(null);
										} else {
											setCategory(category);
											activeFeatureFilter = null;
											activeFilter = null;
											// Wait for DOM update
											setTimeout(() => {
												availableProjectsSection?.scrollIntoView({
													behavior: 'smooth',
													block: 'center',
												});
											}, 100);
										}
									}}
								>
									<div class="text-lg font-bold">
										{getCategoryLabel(category)}
									</div>
									<div class="text-sm opacity-70 mt-1">
										{getProjectCountForCategory(category)} available
									</div>
								</button>
							{/each}
						</div>
					</div>

					{#if !activeFilter && !activeFeatureFilter}
						{#if ongoingProjects.length > 0}
							<h4 class="text-xl mb-4 text-[var(--color-crt)]">
								Ongoing Projects
							</h4>
							<div
								class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mb-8"
							>
								{#each ongoingProjects as projectRecord}
									<div class="project-card">
										<div class="flex flex-col h-full">
											<!-- Header -->
											<div class="flex justify-between items-start mb-4">
												<div>
													<h3 class="text-2xl font-bold">
														{projectRecord.project.name}
													</h3>
													<div class="text-sm opacity-80 mt-1 line-clamp-2">
														{projectRecord.project.requirements}
													</div>
												</div>
												<div class="feature-tag">
													{projectRecord.project.feature}
												</div>
											</div>

											<!-- Progress Section -->
											<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
												<!-- Work Progress -->
												<div class="progress-section">
													<h4 class="section-title">Progress</h4>
													<div class="space-y-2">
														{#if projectRecord.project.costs.product > 0}
															<div class="progress-item">
																<span>Product</span>
																<div class="flex items-center gap-2">
																	{#if projectRecord.costs_remaining.product <= 0}
																		<div
																			class="text-[var(--color-crt)] text-xl"
																		>
																			✓
																		</div>
																	{:else}
																		<div class="progress-bar">
																			<div
																				class="progress-fill {getJobColor(
																					JOB_TYPE.PRODUCT,
																				)}"
																				style="width: {Math.max(
																					0,
																					Math.min(
																						100,
																						(1 -
																							projectRecord.costs_remaining
																								.product /
																								projectRecord.project.costs
																									.product) *
																							100,
																					),
																				)}%"
																			></div>
																		</div>
																		<span class="text-sm">
																			{Math.floor(
																				projectRecord.project.costs.product -
																					projectRecord.costs_remaining.product,
																			)}/{projectRecord.project.costs.product}
																		</span>
																	{/if}
																</div>
															</div>
														{/if}
														{#if projectRecord.project.costs.engineering > 0}
															<div class="progress-item">
																<span>Engineering</span>
																<div class="flex items-center gap-2">
																	{#if projectRecord.costs_remaining.engineering <= 0}
																		<div
																			class="text-[var(--color-crt)] text-xl"
																		>
																			✓
																		</div>
																	{:else}
																		<div class="progress-bar">
																			<div
																				class="progress-fill {getJobColor(
																					JOB_TYPE.ENGINEERING,
																				)}"
																				style="width: {Math.max(
																					0,
																					Math.min(
																						100,
																						(1 -
																							projectRecord.costs_remaining
																								.engineering /
																								projectRecord.project.costs
																									.engineering) *
																							100,
																					),
																				)}%"
																			></div>
																		</div>
																		<span class="text-sm">
																			{Math.floor(
																				projectRecord.project.costs
																					.engineering -
																					projectRecord.costs_remaining
																						.engineering,
																			)}/{projectRecord.project.costs
																				.engineering}
																		</span>
																	{/if}
																</div>
															</div>
														{/if}
														{#if projectRecord.project.costs.design > 0}
															<div class="progress-item">
																<span>Design</span>
																<div class="flex items-center gap-2">
																	{#if projectRecord.costs_remaining.design <= 0}
																		<div
																			class="text-[var(--color-crt)] text-xl"
																		>
																			✓
																		</div>
																	{:else}
																		<div class="progress-bar">
																			<div
																				class="progress-fill {getJobColor(
																					JOB_TYPE.DESIGN,
																				)}"
																				style="width: {Math.max(
																					0,
																					Math.min(
																						100,
																						(1 -
																							projectRecord.costs_remaining
																								.design /
																								projectRecord.project.costs
																									.design) *
																							100,
																					),
																				)}%"
																			></div>
																		</div>
																		<span class="text-sm">
																			{Math.floor(
																				projectRecord.project.costs.design -
																					projectRecord.costs_remaining.design,
																			)}/{projectRecord.project.costs.design}
																		</span>
																	{/if}
																</div>
															</div>
														{/if}
														{#if projectRecord.project.costs.growth > 0}
															<div class="progress-item">
																<span>Growth</span>
																<div class="flex items-center gap-2">
																	{#if projectRecord.costs_remaining.growth <= 0}
																		<div
																			class="text-[var(--color-crt)] text-xl"
																		>
																			✓
																		</div>
																	{:else}
																		<div class="progress-bar">
																			<div
																				class="progress-fill {getJobColor(
																					JOB_TYPE.GROWTH,
																				)}"
																				style="width: {Math.max(
																					0,
																					Math.min(
																						100,
																						(1 -
																							projectRecord.costs_remaining
																								.growth /
																								projectRecord.project.costs
																									.growth) *
																							100,
																					),
																				)}%"
																			></div>
																		</div>
																		<span class="text-sm">
																			{Math.floor(
																				projectRecord.project.costs.growth -
																					projectRecord.costs_remaining.growth,
																			)}/{projectRecord.project.costs.growth}
																		</span>
																	{/if}
																</div>
															</div>
														{/if}
													</div>
												</div>

												<!-- Assignees -->
												<div class="assignees-section">
													<h4 class="section-title">Assignees</h4>
													<div class="flex flex-wrap gap-2">
														{#each projectRecord.assignees as employeeId}
															{#if $g.website}
																{@const foundEmployee =
																	$g.website.employees.find(
																		(e) => e.id === employeeId,
																	)}
																{#if foundEmployee !== undefined}
																	<div
																		class="text-center select-none {getJobColor(
																			foundEmployee.job,
																		)} text-md px-2 cursor-pointer whitespace-nowrap overflow-hidden align-middle items-center flex justify-center"
																		on:click={() =>
																			openEmployeeModal(foundEmployee)}
																	>
																		<span
																			class="text-sm align-middle items-center flex justify-center select-none"
																		>
																			{foundEmployee.name}
																			{foundEmployee.happiness > 70
																				? '😃'
																				: foundEmployee.happiness > 40
																					? '🫤'
																					: '😡'}
																		</span>
																	</div>
																{/if}
															{/if}
														{/each}
													</div>
												</div>
											</div>

											<!-- Actions -->
											<div class="flex gap-2 mt-auto pt-4">
												{#if !isProjectComplete(projectRecord)}
													<button
														class="btn btn-sm btn-primary flex-1"
														on:click={() => {
															showAssignPopup.project = projectRecord.project;
															showAssignPopup.show = true;
														}}
													>
														Assign Employee
													</button>
													<button
														class="btn btn-sm btn-error"
														on:click={() =>
															abandonProject(projectRecord.project)}
													>
														Abandon
													</button>
												{:else}
													<button
														class="btn btn-sm btn-accent rainbow-btn flex-1"
														on:click={() => {
															if ($g.website) {
																const projectIndex =
																	$g.website.projects.findIndex(
																		(p) =>
																			p.project.name ===
																			projectRecord.project.name,
																	);
																if (projectIndex !== -1) {
																	g.update((g) => {
																		if (!g.website) return g;
																		const updatedProjects = [
																			...g.website.projects,
																		];
																		updatedProjects[projectIndex] =
																			shipProject(projectRecord);
																		return {
																			...g,
																			website: {
																				...g.website,
																				projects: updatedProjects,
																			},
																		};
																	});
																}
															}
														}}
													>
														SHIP IT!
													</button>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Available Projects -->
						<h4
							class="text-xl mb-4 text-[var(--color-crt)] mt-4"
							bind:this={availableProjectsSection}
						>
							{activeCategory ? getCategoryLabel(activeCategory) : 'Available'} Projects
							{#if activeFilter || activeFeatureFilter}(Filtered){/if}
						</h4>
						{#if filteredProjects.length === 0}
							<div class="text-center py-8">
								<p class="text-xl">No projects available in this category.</p>
							</div>
						{:else}
							<div
								class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
							>
								{#each filteredProjects as project}
									<div class="project-card">
										<div class="flex flex-col h-full">
											<!-- Header -->
											<div class="flex justify-between items-start mb-4">
												<div>
													<h3 class="text-xl font-bold">{project.name}</h3>
													<div class="opacity-80 mt-1 line-clamp-2">
														{project.requirements}
													</div>
												</div>
												<div class="feature-tag">
													{project.feature}
												</div>
											</div>

											<!-- Costs and Impact -->
											<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
												<!-- Setup Costs -->
												<div class="cost-section">
													<h4 class="section-title">Required Work</h4>
													<div class="space-y-2">
														{#if project.costs.product > 0}
															<div class="cost-item">
																<span>Product</span>
																<span class={getJobColor(JOB_TYPE.PRODUCT)}
																	>{project.costs.product}</span
																>
															</div>
														{/if}
														{#if project.costs.engineering > 0}
															<div class="cost-item">
																<span>Engineering</span>
																<span class={getJobColor(JOB_TYPE.ENGINEERING)}
																	>{project.costs.engineering}</span
																>
															</div>
														{/if}
														{#if project.costs.design > 0}
															<div class="cost-item">
																<span>Design</span>
																<span class={getJobColor(JOB_TYPE.DESIGN)}
																	>{project.costs.design}</span
																>
															</div>
														{/if}
														{#if project.costs.growth > 0}
															<div class="cost-item">
																<span>Growth</span>
																<span class={getJobColor(JOB_TYPE.GROWTH)}
																	>{project.costs.growth}</span
																>
															</div>
														{/if}
													</div>
												</div>

												<!-- Impact -->
												<div class="impact-section">
													<h4 class="section-title">Impact</h4>
													<div class="space-y-2">
														{#each Object.entries(project.scores).sort((a, b) => b[1] - a[1]) as [scoreName, value]}
															{#if value !== 0}
																<div class="impact-item">
																	<span
																		>{scoreName[0].toUpperCase() +
																			scoreName.slice(1)}</span
																	>
																	<span
																		class={value > 0
																			? 'text-[var(--color-crt)]'
																			: 'text-red-500'}
																		>{value > 0 ? '+' : ''}{value}</span
																	>
																</div>
															{/if}
														{/each}
													</div>
												</div>
											</div>

											<!-- Action Button -->
											<div class="mt-auto pt-4">
												<button
													class="btn btn-sm w-full {!hasRequiredJobTypes(
														project,
													)[0]
														? 'btn-error'
														: 'btn-primary'}"
													on:click={() => {
														if (hasRequiredJobTypes(project)[0]) {
															startProject(project);
															activeFilter = null;
															activeFeatureFilter = null;
														} else {
															$projectSearchPopupOpen = false;
															$hiringPopupOpen = true;
														}
													}}
												>
													{#if hasRequiredJobTypes(project)[0]}
														Start Project
													{:else}
														Need to hire: {hasRequiredJobTypes(project)[1]}
													{/if}
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{:else}
						<div class="text-center py-8 opacity-70">
							<p class="text-xl">
								Select a category to view available projects
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
		<div
			class="fixed bottom-0 left-0 w-full px-6 py-4 bg-[var(--color-terminal)] border-t-4 border-[var(--color-crt)] z-50"
		>
			<WebsiteScores compact={true} />
		</div>

		<form method="dialog" class="modal-backdrop">
			<button on:click={handleCancel}>close</button>
		</form>
	</div>
{/if}

<div class="employee-tiles-container">
	{#each $g.website?.employees ?? [] as e}
		<EmployeeTile {e} displayName={false} />
	{/each}
</div>

{#if $g.website}
	<EmployeeModal
		e={selectedEmployee}
		open={employeeModalOpen}
		onclose={closeEmployeeModal}
	/>
{/if}

<style>
	.projects-container {
		scrollbar-color: var(--color-crt) var(--color-terminal);
		height: calc(100vh - 180px);
		padding-bottom: 80px; /* Space for fixed footer */
		padding-right: 8px; /* Always reserve space for scrollbar */
		overflow-y: scroll; /* Always show scrollbar space */
		scrollbar-gutter: stable; /* Modern browsers: reserve scrollbar space */
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
		overflow-y: scroll; /* Always show scrollbar space */
		scrollbar-gutter: stable; /* Modern browsers: reserve scrollbar space */
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
		@apply border-2 border-[var(--color-crt)] p-4 bg-black/20 rounded-lg;
		transition: all 0.2s ease-in-out;
	}

	.project-card:hover {
		@apply bg-black/30;
		transform: translateY(-1px);
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
		background: var(--color-terminal);
		backdrop-filter: blur(8px);
	}

	.monetization-setting {
		background: rgba(0, 0, 0, 0.3);
		padding: 1rem;
		border-radius: 0.5rem;
		border: 2px solid var(--color-crt);
	}

	.category-card {
		background: rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease-in-out;
	}

	.category-card:hover {
		transform: translateY(-1px);
	}

	.feature-tag {
		@apply text-xs px-2 py-1 border border-[var(--color-crt)] rounded text-[var(--color-crt)];
	}

	.section-title {
		@apply text-xl font-semibold mb-2 text-[var(--color-crt)];
	}

	.progress-item,
	.impact-item {
		@apply flex items-center justify-between text-lg;
	}

	.cost-item {
		@apply flex items-center gap-4 text-lg;
	}

	.progress-bar {
		@apply w-24 h-2 bg-black/30 rounded-full overflow-hidden ml-2;
	}

	.progress-fill {
		@apply h-full transition-all duration-300;
	}

	.employee-tiles-container {
		position: fixed;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: -1;
	}
</style>
