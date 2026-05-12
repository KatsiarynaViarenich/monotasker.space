<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import {
		addTask,
		deleteTask,
		completeTask,
		clearOrbitTasks,
		COLOR_MAP,
		type Orbit
	} from '$lib/stores/galaxy.svelte';

	let {
		orbit,
		isActive = false,
		focused = false
	}: { orbit: Orbit; isActive: boolean; focused?: boolean } = $props();

	let colors = $derived(COLOR_MAP[orbit.color]);
	let pendingTasks = $derived(orbit.tasks.filter((t) => !t.completed));
	let completedCount = $derived(orbit.tasks.filter((t) => t.completed).length);
	let totalTasks = $derived(orbit.tasks.length);
	let progressPercentage = $derived(totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100);

	// Journey / focus mode — local state
	let isJourneyActive = $state(false);
	let currentTask = $state<{ id: string; text: string; completed: boolean } | null>(null);
	let newTaskInput = $state('');

	function handleAddTask(e: SubmitEvent) {
		e.preventDefault();
		addTask(orbit.id, newTaskInput);
		newTaskInput = '';
	}

	function handleAddTaskJourney(e: SubmitEvent) {
		e.preventDefault();
		addTask(orbit.id, newTaskInput);
		newTaskInput = '';
	}

	function startJourney() {
		const pending = orbit.tasks.filter((t) => !t.completed);
		if (pending.length === 0) return;
		isJourneyActive = true;
		pickRandom(pending);
	}

	function pickRandom(pending = orbit.tasks.filter((t) => !t.completed)) {
		if (pending.length === 0) {
			isJourneyActive = false;
			currentTask = null;
			return;
		}
		currentTask = pending[Math.floor(Math.random() * pending.length)];
	}

	function completeCurrentTask() {
		if (!currentTask) return;
		completeTask(orbit.id, currentTask.id);
		const pending = orbit.tasks.filter((t) => !t.completed && t.id !== currentTask!.id);
		pickRandom(pending);
	}

	function abortJourney() {
		isJourneyActive = false;
		currentTask = null;
	}

	function handleClear() {
		if (confirm(`Clear all tasks in "${orbit.name}"?`)) {
			clearOrbitTasks(orbit.id);
			isJourneyActive = false;
			currentTask = null;
		}
	}
</script>

<!-- ═══════════════════════════════════════════════════
     JOURNEY / HYPERSPACE MODE  (full-screen overlay)
══════════════════════════════════════════════════════ -->
{#if isJourneyActive}
	<div
		transition:fade={{ duration: 400 }}
		class="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
		style="background: radial-gradient(circle at 50% 40%, {colors.glow} 0%, transparent 60%), #0b0e14;"
	>
		<!-- Badge -->
		<div
			in:fly={{ y: -20, delay: 200, duration: 500 }}
			class="mb-10 inline-flex items-center gap-3 rounded-full border px-6 py-2 backdrop-blur-md"
			style="border-color: {colors.border}; background: {colors.glow}20;"
		>
			<span class="relative flex h-2 w-2">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
					style="background: {colors.text};"
				></span>
				<span
					class="relative inline-flex h-2 w-2 rounded-full"
					style="background: {colors.text};"
				></span>
			</span>
			<span class="text-[10px] font-black uppercase tracking-[0.5em]" style="color: {colors.text};">
				{orbit.name} · Hyperspace Focus
			</span>
		</div>

		<!-- Current task text -->
		{#if currentTask}
			<div in:fly={{ y: 30, duration: 700 }} class="group relative mb-20">
				<div
					class="absolute -inset-6 rounded-3xl opacity-0 blur-2xl transition-opacity duration-1000 group-hover:opacity-100"
					style="background: linear-gradient(to right, {colors.glow}, transparent);"
				></div>
				<h1 class="relative text-5xl font-black leading-tight text-white md:text-7xl lg:text-8xl">
					{currentTask.text}
				</h1>
			</div>
		{/if}

		<!-- Done button -->
		<div class="group relative">
			<div
				class="absolute inset-0 scale-150 rounded-full opacity-20 blur-3xl transition-transform group-hover:scale-[1.7]"
				style="background: {colors.glow};"
			></div>
			<button
				onclick={completeCurrentTask}
				class="orbit-done-btn relative flex h-44 w-44 flex-col items-center justify-center rounded-full border text-white backdrop-blur-md transition-all hover:scale-105"
				style="border-color: {colors.border}; background: {colors.glow}15; --pulse-glow: {colors.glow};"
			>
				<div class="mb-1 text-xs font-medium tracking-[0.3em] opacity-40 transition-opacity group-hover:opacity-100">
					DONE
				</div>
				<div class="text-3xl font-bold tracking-tighter">FINISH</div>
			</button>
		</div>

		<!-- Bottom controls -->
		<div class="absolute bottom-10 flex flex-col items-center gap-4">
			<button
				onclick={abortJourney}
				class="text-xs font-bold uppercase tracking-widest text-white/30 transition-all hover:tracking-[0.5em] hover:text-white/60"
			>
				Abort Journey
			</button>
			<form
				onsubmit={handleAddTaskJourney}
				class="opacity-30 transition-opacity focus-within:opacity-100 hover:opacity-100"
			>
				<input
					type="text"
					bind:value={newTaskInput}
					placeholder="New task in queue..."
					class="w-60 border-b border-white/10 bg-transparent px-4 py-2 text-center text-sm text-white/60 transition-all focus:border-current focus:text-white focus:outline-none"
				/>
			</form>
		</div>
	</div>

<!-- ═══════════════════════════════════════════════════
     DEFAULT ORBIT PANEL CARD
══════════════════════════════════════════════════════ -->
{:else}
	<div
		class="orbit-card relative flex flex-col rounded-3xl p-6 transition-all duration-300"
		class:orbit-card-active={isActive}
		style="--orbit-glow: {colors.glow}; --orbit-border: {colors.border}; --orbit-text: {colors.text};"
	>
		<!-- Progress bar -->
		<div class="mb-5 h-[3px] w-full overflow-hidden rounded-full bg-white/5">
			<div
				class="h-full rounded-full transition-all duration-700"
				style="width: {progressPercentage}%; background: linear-gradient(to right, {colors.text}, {colors.glow});"
			></div>
		</div>

		<!-- Header -->
		<header class="mb-5 flex items-start justify-between">
			<div>
				<h2 class="text-lg font-bold text-white" style="text-shadow: 0 0 12px {colors.glow};">
					{orbit.name}
				</h2>
				<p class="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-white/30">
					{pendingTasks.length} pending · {completedCount} done
				</p>
			</div>
			<span
				class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
				style="background: {colors.text}; box-shadow: 0 0 10px {colors.glow};"
			></span>
		</header>

		<!-- Add task — stopPropagation so galaxy card click doesn't fire -->
		<div
			role="presentation"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<form onsubmit={handleAddTask} class="relative mb-4">
				<input
					type="text"
					bind:value={newTaskInput}
					placeholder="Add a task..."
					class="orbit-input w-full rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none"
					style="--focus-color: {colors.text};"
				/>
				<button
					type="submit"
					aria-label="Add task"
					class="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-white transition-transform hover:scale-105 active:scale-95"
					style="background: linear-gradient(135deg, {colors.text}99, {colors.glow});"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
				</button>
			</form>
		</div>

		<!-- Task list -->
		<div
			class="custom-scrollbar mb-4 space-y-2 overflow-y-auto pr-1"
			style="max-height: {focused ? '420px' : '220px'}; min-height: 60px;"
		>
			{#each pendingTasks as task (task.id)}
				<div
					transition:fly={{ y: 10, duration: 300 }}
					class="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/4 px-4 py-3 transition-all hover:border-white/10 hover:bg-white/8"
					onclick={(e) => e.stopPropagation()}
					role="presentation"
				>
					<span class="flex-1 text-sm font-medium text-white/75">{task.text}</span>
					<div class="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
						<button
							onclick={() => completeTask(orbit.id, task.id)}
							aria-label="Complete task"
							class="rounded-lg p-1 text-white/30 transition-colors hover:text-emerald-400"
						>
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						</button>
						<button
							onclick={() => deleteTask(orbit.id, task.id)}
							aria-label="Delete task"
							class="rounded-lg p-1 text-white/30 transition-colors hover:text-red-400"
						>
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				</div>
			{:else}
				<div
					class="flex items-center justify-center rounded-xl border-2 border-dashed border-white/5 py-8 text-center text-xs italic text-white/20"
				>
					Orbit is empty. Add a task to begin.
				</div>
			{/each}
		</div>

		<!-- Actions -->
		<div class="space-y-2" onclick={(e) => e.stopPropagation()} role="presentation">
			<button
				onclick={startJourney}
				disabled={pendingTasks.length === 0}
				class="orbit-focus-btn w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-25"
				style="background: linear-gradient(135deg, {colors.text}55, {colors.glow}); border: 1px solid {colors.border};"
			>
				Enter Flow State
			</button>

			{#if orbit.tasks.length > 0}
				<button
					onclick={handleClear}
					class="w-full text-[10px] font-bold uppercase tracking-widest text-white/20 transition-colors hover:text-white/50"
				>
					Reset Orbit
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.orbit-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.07);
		backdrop-filter: blur(12px) saturate(160%);
	}

	.orbit-card:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: var(--orbit-border, rgba(255, 255, 255, 0.12));
		box-shadow: 0 0 30px var(--orbit-glow, transparent), 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.orbit-card-active {
		border-color: var(--orbit-border, rgba(255, 255, 255, 0.15));
		box-shadow: 0 0 25px var(--orbit-glow, transparent), 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.orbit-input {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(4px);
		transition: all 0.25s ease;
	}

	.orbit-input:focus {
		background: rgba(255, 255, 255, 0.08);
		border-color: var(--focus-color, rgba(255, 255, 255, 0.3));
		box-shadow: 0 0 12px color-mix(in srgb, var(--focus-color, white) 30%, transparent);
	}

	.orbit-focus-btn {
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.orbit-focus-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px var(--orbit-glow, transparent);
	}

	.orbit-focus-btn:active:not(:disabled) {
		transform: translateY(1px);
	}

	.orbit-done-btn {
		animation: orbit-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes orbit-pulse {
		0%,
		100% {
			box-shadow: 0 0 8px var(--pulse-glow, transparent);
		}
		50% {
			box-shadow: 0 0 35px var(--pulse-glow, transparent);
		}
	}
</style>
