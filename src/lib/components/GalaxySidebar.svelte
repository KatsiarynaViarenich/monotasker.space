<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	import {
		getOrbits,
		getActiveOrbitId,
		getIsSidebarOpen,
		setActiveOrbit,
		focusOrbit,
		toggleSidebar,
		addOrbit,
		deleteOrbit,
		renameOrbit,
		recolorOrbit,
		ORBIT_COLORS,
		COLOR_MAP,
		type OrbitColor
	} from '$lib/stores/galaxy.svelte';

	let orbits = $derived(getOrbits());
	let activeOrbitId = $derived(getActiveOrbitId());
	let isOpen = $derived(getIsSidebarOpen());

	// New orbit form state
	let isCreating = $state(false);
	let newOrbitName = $state('');
	let newOrbitColor = $state<OrbitColor>('cyan');

	// Rename state
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');

	function startCreate() {
		isCreating = true;
		newOrbitName = '';
		newOrbitColor = ORBIT_COLORS[orbits.length % ORBIT_COLORS.length];
	}

	function confirmCreate() {
		if (newOrbitName.trim()) {
			addOrbit(newOrbitName, newOrbitColor);
		}
		isCreating = false;
		newOrbitName = '';
	}

	function startRename(id: string, currentName: string) {
		renamingId = id;
		renameValue = currentName;
	}

	function confirmRename() {
		if (renamingId) {
			renameOrbit(renamingId, renameValue);
			renamingId = null;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isCreating = false;
			renamingId = null;
		}
	}
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'g' && !(e.target instanceof HTMLInputElement)) toggleSidebar(); }} />

{#if isOpen}
	<div
		transition:fly={{ x: -280, duration: 350 }}
		class="galaxy-sidebar fixed top-0 left-0 z-40 flex h-screen w-[260px] flex-col py-6 px-4"
		role="navigation"
		aria-label="Galaxy orbits"
	>
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between px-2">
			<div class="flex items-center gap-2.5">
				<svg class="h-5 w-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="12" cy="12" r="10"/>
					<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/>
					<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/>
					<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
				</svg>
				<span class="text-[11px] font-black tracking-[0.3em] text-white/50 uppercase">Galaxy</span>
			</div>
			<button
				onclick={toggleSidebar}
				aria-label="Close sidebar"
				class="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/70"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</button>
		</div>

		<!-- Orbit list -->
		<div class="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
			{#each orbits as orbit (orbit.id)}
				{@const colors = COLOR_MAP[orbit.color]}
				{@const isActive = orbit.id === activeOrbitId}
				<div
					class="orbit-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer"
					class:orbit-item-active={isActive}
					onclick={() => focusOrbit(orbit.id)}
					style="--orbit-glow: {colors.glow}; --orbit-border: {colors.border}; --orbit-text: {colors.text};"
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && focusOrbit(orbit.id)}
				>
					<!-- Color dot -->
					<span
						class="h-2 w-2 shrink-0 rounded-full transition-all duration-300"
						style="background: {colors.text}; box-shadow: {isActive ? `0 0 8px ${colors.glow}` : 'none'};"
					></span>

					<!-- Name / rename input -->
					{#if renamingId === orbit.id}
						<input
							type="text"
							bind:value={renameValue}
							class="flex-1 bg-transparent text-sm text-white focus:outline-none"
							onblur={confirmRename}
							onkeydown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') renamingId = null; }}
							use:focusOnMount
							onclick={(e) => e.stopPropagation()}
						/>
					{:else}
						<span
							class="flex-1 truncate text-sm font-medium transition-colors"
							style="color: {isActive ? colors.text : 'rgba(255,255,255,0.6)'};"
						>
							{orbit.name}
						</span>
					{/if}

					<!-- Stats badge -->
					{#if !renamingId || renamingId !== orbit.id}
						{@const pending = orbit.tasks.filter(t => !t.completed).length}
						{#if pending > 0}
							<span
								class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
								style="background: {colors.glow}; color: {colors.text};"
							>
								{pending}
							</span>
						{/if}
					{/if}

					<!-- Hover actions -->
					{#if !renamingId || renamingId !== orbit.id}
						<div class="absolute right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								onclick={(e) => { e.stopPropagation(); startRename(orbit.id, orbit.name); }}
								aria-label="Rename orbit"
								class="rounded p-1 text-white/30 hover:text-white/80"
							>
								<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
									<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
								</svg>
							</button>
							{#if orbits.length > 1}
								<button
									onclick={(e) => { e.stopPropagation(); deleteOrbit(orbit.id); }}
									aria-label="Delete orbit"
									class="rounded p-1 text-white/30 hover:text-red-400"
								>
									<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polyline points="3 6 5 6 21 6"/>
										<path d="M19 6l-1 14H6L5 6"/>
										<path d="M10 11v6M14 11v6"/>
										<path d="M9 6V4h6v2"/>
									</svg>
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Color picker (shown for active orbit) -->
				{#if isActive && !renamingId}
					<div class="mb-1 ml-8 flex gap-1.5 px-2" transition:fade={{ duration: 150 }}>
						{#each ORBIT_COLORS as color}
							<button
								onclick={(e) => { e.stopPropagation(); recolorOrbit(orbit.id, color); }}
								class="h-3 w-3 rounded-full transition-transform hover:scale-125"
								style="background: {COLOR_MAP[color].text}; outline: {orbit.color === color ? `2px solid ${COLOR_MAP[color].text}` : 'none'}; outline-offset: 1px;"
								aria-label="Set color {color}"
							></button>
						{/each}
					</div>
				{/if}
			{/each}
		</div>

		<!-- New orbit button / form -->
		<div class="mt-4 border-t border-white/5 pt-4">
			{#if isCreating}
				<div class="space-y-2" transition:fly={{ y: 8, duration: 200 }}>
					<input
						type="text"
						bind:value={newOrbitName}
						placeholder="Orbit name..."
						class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none"
						onkeydown={(e) => { if (e.key === 'Enter') confirmCreate(); if (e.key === 'Escape') isCreating = false; }}
						use:focusOnMount
					/>
					<div class="flex items-center justify-between">
						<div class="flex gap-1.5">
							{#each ORBIT_COLORS as color}
								<button
									onclick={() => (newOrbitColor = color)}
									class="h-4 w-4 rounded-full transition-transform hover:scale-110"
									style="background: {COLOR_MAP[color].text}; outline: {newOrbitColor === color ? `2px solid ${COLOR_MAP[color].text}` : 'none'}; outline-offset: 1px;"
									aria-label="Pick color {color}"
								></button>
							{/each}
						</div>
						<div class="flex gap-1">
							<button onclick={() => isCreating = false} class="rounded px-2 py-1 text-xs text-white/30 hover:text-white/60">Cancel</button>
							<button
								onclick={confirmCreate}
								class="rounded px-3 py-1 text-xs font-bold text-white"
								style="background: {COLOR_MAP[newOrbitColor].glow};"
							>Create</button>
						</div>
					</div>
				</div>
			{:else}
				<button
					onclick={startCreate}
					class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/30 transition-all hover:bg-white/5 hover:text-white/60"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<line x1="12" y1="8" x2="12" y2="16"/>
						<line x1="8" y1="12" x2="16" y2="12"/>
					</svg>
					New Orbit
				</button>
			{/if}
		</div>

		<!-- Keyboard hint -->
		<p class="mt-3 text-center text-[10px] text-white/15">Press <kbd class="rounded bg-white/10 px-1">G</kbd> to toggle</p>
	</div>
{/if}

<!-- Toggle button (when closed) -->
{#if !isOpen}
	<button
		onclick={toggleSidebar}
		transition:fade={{ duration: 200 }}
		aria-label="Open galaxy sidebar"
		class="fixed top-6 left-4 z-40 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/40 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/70"
	>
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<circle cx="12" cy="12" r="10"/>
			<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/>
			<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/>
			<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
		</svg>
		Galaxy
	</button>
{/if}

<style>
	.galaxy-sidebar {
		background: rgba(8, 10, 20, 0.85);
		backdrop-filter: blur(20px) saturate(180%);
		border-right: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow: 4px 0 40px rgba(0, 0, 0, 0.5);
	}

	.orbit-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.orbit-item-active {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--orbit-border, rgba(255,255,255,0.1));
		box-shadow: 0 0 20px var(--orbit-glow, transparent);
	}

	.orbit-item-active:hover {
		background: rgba(255, 255, 255, 0.08);
	}
</style>
