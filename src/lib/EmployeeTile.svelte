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
</script>

<!-- Markdown -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="employee-tile text-center {!displayName
		? 'w-8 h-8 px-0'
		: ''} {color} text-md px-2 cursor-pointer whitespace-nowrap overflow-hidden"
	on:click={() => (openModal = true)}
>
	{displayName ? e.name : isIdle ? '...' : ''}
</div>

<EmployeeModal {e} open={openModal} onclose={() => (openModal = false)} />
