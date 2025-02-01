<script lang="ts">
	import EmployeeModal from './EmployeeModal.svelte';
	import { JOB_TYPE, type employee } from './objects/types';
	import { getJobColor } from './utils';

	export let e: employee;
	export let displayName = false;

	let color = getJobColor(e.job);
	let openModal = false;
</script>

<!-- Markdown -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="employee-tile {!displayName
		? 'w-8 h-8'
		: ''} {color} text-md cursor-pointer whitespace-nowrap overflow-hidden"
	on:click={() => (openModal = true)}
>
	{displayName ? e.name : ''}
</div>

<EmployeeModal {e} open={openModal} onclose={() => (openModal = false)} />
