<script lang="ts">
	import EmployeeModal from './EmployeeModal.svelte';
	import { JOB_TYPE, type employee } from './objects/types';
	import { getJobColor } from './utils';

	export let e: employee;

	let color = getJobColor(e.job);
	let openModal = false;
</script>

<!-- Markdown -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="employee-tile w-8 h-8 {color}"
	on:click={() => (openModal = true)}
></div>

<EmployeeModal {e} open={openModal} onclose={() => (openModal = false)} />
