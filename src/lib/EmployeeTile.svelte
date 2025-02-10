<script lang="ts">
	import EmployeeModal from './EmployeeModal.svelte';
	import { JOB_TYPE, type employee } from './objects/types';
	import { g } from './store';
	import { getAvailableEmployees, getJobColor } from './utils';

	export let e: employee;
	export let displayName = false;

	let color = getJobColor(e.job);
	let openModal = false;

	let isIdle = false;
	$: isIdle = getAvailableEmployees($g.website).includes(e);

	$: happyString = e.happiness > 70 ? '😃' : e.happiness > 40 ? '🫤' : '😡';
</script>

<!-- Markdown -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="employee-tile text-center select-none {!displayName
		? 'w-8 h-8 px-0 text-xs align-bottom flex flex-col justify-end'
		: ''} {color} text-md px-2 cursor-pointer whitespace-nowrap overflow-hidden align-middle items-center flex justify-center"
	on:click={() => (openModal = true)}
>
	<span
		class="text-sm align-middle items-center flex justify-center select-none"
	>
		{displayName ? e.name + ' ' + happyString : isIdle ? '...' : ''}
	</span>
</div>

<EmployeeModal {e} open={openModal} onclose={() => (openModal = false)} />

<style>
	.employee-tile {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
</style>
