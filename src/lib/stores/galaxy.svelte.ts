export interface Task {
	id: string;
	text: string;
	completed: boolean;
}

export interface Orbit {
	id: string;
	name: string;
	color: OrbitColor;
	tasks: Task[];
	createdAt: number;
}

export type OrbitColor = 'cyan' | 'violet' | 'rose' | 'amber' | 'emerald' | 'orange';

export const ORBIT_COLORS: OrbitColor[] = ['cyan', 'violet', 'rose', 'amber', 'emerald', 'orange'];

export const COLOR_MAP: Record<OrbitColor, { glow: string; border: string; text: string; progress: string }> = {
	cyan:    { glow: 'rgba(6,182,212,0.5)',   border: 'rgba(6,182,212,0.3)',   text: '#22d3ee', progress: 'from-cyan-400 via-blue-500 to-indigo-500' },
	violet:  { glow: 'rgba(139,92,246,0.5)',  border: 'rgba(139,92,246,0.3)',  text: '#a78bfa', progress: 'from-violet-400 via-purple-500 to-fuchsia-500' },
	rose:    { glow: 'rgba(244,63,94,0.5)',   border: 'rgba(244,63,94,0.3)',   text: '#fb7185', progress: 'from-rose-400 via-pink-500 to-fuchsia-600' },
	amber:   { glow: 'rgba(245,158,11,0.5)',  border: 'rgba(245,158,11,0.3)',  text: '#fbbf24', progress: 'from-amber-400 via-orange-500 to-red-500' },
	emerald: { glow: 'rgba(16,185,129,0.5)',  border: 'rgba(16,185,129,0.3)', text: '#34d399', progress: 'from-emerald-400 via-teal-500 to-cyan-600' },
	orange:  { glow: 'rgba(249,115,22,0.5)',  border: 'rgba(249,115,22,0.3)', text: '#fb923c', progress: 'from-orange-400 via-red-500 to-rose-600' },
};

const STORAGE_KEY = 'monotasker_galaxy';

function makeDefaultOrbit(): Orbit {
	return {
		id: crypto.randomUUID(),
		name: 'My Orbit',
		color: 'cyan',
		tasks: [],
		createdAt: Date.now()
	};
}

function loadFromStorage(): Orbit[] {
	if (typeof localStorage === 'undefined') return [makeDefaultOrbit()];
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		// Migrate old single-list data
		const legacy = localStorage.getItem('monotasker_data');
		if (legacy) {
			const tasks: Task[] = JSON.parse(legacy);
			const orbit = makeDefaultOrbit();
			orbit.tasks = tasks;
			return [orbit];
		}
		return [makeDefaultOrbit()];
	}
	return JSON.parse(raw) as Orbit[];
}

// --- Reactive state ---
let orbits = $state<Orbit[]>(loadFromStorage());
let activeOrbitId = $state<string>(orbits[0]?.id ?? '');
let focusedOrbitId = $state<string | null>(null);
let isSidebarOpen = $state(true);

// Persist to localStorage
function save() {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(orbits));
	}
}

// --- Derived ---
export function getOrbits() { return orbits; }
export function getActiveOrbitId() { return activeOrbitId; }
export function getFocusedOrbitId() { return focusedOrbitId; }
export function getIsSidebarOpen() { return isSidebarOpen; }

export function getActiveOrbit(): Orbit | undefined {
	return orbits.find(o => o.id === activeOrbitId);
}

export function getFocusedOrbit(): Orbit | undefined {
	return focusedOrbitId ? orbits.find(o => o.id === focusedOrbitId) : undefined;
}

// --- Mutations ---
export function setActiveOrbit(id: string) {
	activeOrbitId = id;
}

export function focusOrbit(id: string | null) {
	focusedOrbitId = id;
	if (id) activeOrbitId = id;
}

export function toggleSidebar() {
	isSidebarOpen = !isSidebarOpen;
}

export function setSidebarOpen(open: boolean) {
	isSidebarOpen = open;
}

export function addOrbit(name: string, color: OrbitColor) {
	const orbit: Orbit = {
		id: crypto.randomUUID(),
		name: name.trim() || 'New Orbit',
		color,
		tasks: [],
		createdAt: Date.now()
	};
	orbits = [...orbits, orbit];
	activeOrbitId = orbit.id;
	save();
	return orbit;
}

export function deleteOrbit(id: string) {
	if (orbits.length <= 1) return; // keep at least one
	orbits = orbits.filter(o => o.id !== id);
	if (activeOrbitId === id) {
		activeOrbitId = orbits[0].id;
	}
	save();
}

export function renameOrbit(id: string, name: string) {
	orbits = orbits.map(o => o.id === id ? { ...o, name: name.trim() || o.name } : o);
	save();
}

export function recolorOrbit(id: string, color: OrbitColor) {
	orbits = orbits.map(o => o.id === id ? { ...o, color } : o);
	save();
}

export function addTask(orbitId: string, text: string) {
	const trimmed = text.trim();
	if (!trimmed) return;
	orbits = orbits.map(o =>
		o.id === orbitId
			? { ...o, tasks: [...o.tasks, { id: crypto.randomUUID(), text: trimmed, completed: false }] }
			: o
	);
	save();
}

export function deleteTask(orbitId: string, taskId: string) {
	orbits = orbits.map(o =>
		o.id === orbitId
			? { ...o, tasks: o.tasks.filter(t => t.id !== taskId) }
			: o
	);
	save();
}

export function completeTask(orbitId: string, taskId: string) {
	orbits = orbits.map(o =>
		o.id === orbitId
			? { ...o, tasks: o.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t) }
			: o
	);
	save();
}

export function clearOrbitTasks(orbitId: string) {
	orbits = orbits.map(o =>
		o.id === orbitId ? { ...o, tasks: [] } : o
	);
	save();
}
