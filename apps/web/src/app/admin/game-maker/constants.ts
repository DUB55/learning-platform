import { GameDesign, GameObject, ObjectType, Prefab } from './types';

export const DEFAULT_GAME_2D: GameDesign = {
    id: 'new-game-2d-' + Date.now(),
    title: 'My 2D Adventure',
    description: 'A brand new 2D platformer',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: false,
    mode: '2d',
    objects: [],
    logic: [],
    settings: {
        gravity: 0.8,
        jumpForce: 12,
        moveSpeed: 5,
        backgroundColor: '#0f172a',
        viewportWidth: 800,
        viewportHeight: 600,
    }
};

export const DEFAULT_GAME_3D: GameDesign = {
    id: 'new-game-3d-' + Date.now(),
    title: 'My 3D World',
    description: 'An immersive 3D experience',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: false,
    mode: '3d',
    objects: [],
    logic: [],
    settings: {
        gravity: [0, -9.81, 0],
        jumpForce: 5,
        moveSpeed: 10,
        backgroundColor: '#000000',
        viewportWidth: 1280,
        viewportHeight: 720,
        skybox: 'sunset',
        ambientLightIntensity: 0.5,
        weather: 'none',
        groundType: 'grass',
        environment: 'empty',
        timeOfDay: 12,
        dayNightCycle: false,
        physicsEnabled: true,
        cameraMode: 'thirdPerson',
        cameraDistance: 10,
    }
};

export const OBJECT_TEMPLATES: Record<ObjectType, Partial<GameObject>> = {
    player: { width: 40, height: 40, depth: 40, color: '#3b82f6', properties: { health: 100, lives: 3, mass: 1 } },
    platform: { width: 100, height: 20, depth: 100, color: '#475569', properties: { friction: 0.8, static: true } },
    enemy: { width: 40, height: 40, depth: 40, color: '#ef4444', properties: { damage: 10, patrol: true, speed: 2 } },
    goal: { width: 50, height: 50, depth: 50, color: '#fbbf24', properties: { nextLevel: true, interactionRadius: 2 } },
    coin: { width: 20, height: 20, depth: 20, color: '#fbbf24', properties: { value: 10, rotate: true } },
    hazard: { width: 40, height: 40, depth: 40, color: '#991b1b', properties: { damage: 100 } },
    trigger: { width: 50, height: 50, depth: 50, color: '#10b981', properties: { onEnter: 'none', invisible: true } },
    light: { width: 10, height: 10, depth: 10, color: '#fff', properties: { intensity: 1, range: 10, type: 'point' } },
    model: { width: 50, height: 50, depth: 50, color: '#8b5cf6', properties: { modelUrl: '', scale: 1 } },
    character: { width: 40, height: 80, depth: 40, color: '#ec4899', properties: { npc: true, dialogue: 'Hello!', speed: 2 } },
    car: { width: 80, height: 40, depth: 160, color: '#ef4444', properties: { drivable: true, speed: 20 } },
    house: { width: 400, height: 300, depth: 400, color: '#92400e', properties: { interior: false } },
    tree: { width: 100, height: 200, depth: 100, color: '#15803d', properties: { type: 'pine' } },
    building: { width: 600, height: 1200, depth: 600, color: '#475569', properties: { floors: 5 } },
    fence: { width: 100, height: 50, depth: 10, color: '#78350f', properties: { length: 100 } },
    rock: { width: 60, height: 40, depth: 60, color: '#57534e', properties: { scale: 1 } },
    crate: { width: 50, height: 50, depth: 50, color: '#92400e', properties: { physics: true, mass: 2 } },
    lamp: { width: 20, height: 250, depth: 20, color: '#1e293b', properties: { lightColor: '#fbbf24', lightIntensity: 2 } },
    particle: { width: 10, height: 10, depth: 10, color: '#fff', properties: { system: 'fire', active: true } },
    flower: { width: 20, height: 20, depth: 20, color: '#f472b6', properties: { type: 'rose' } },
    bush: { width: 60, height: 40, depth: 60, color: '#166534', properties: { density: 1 } },
    mushroom: { width: 15, height: 15, depth: 15, color: '#ef4444', properties: { toxic: false } },
    skyscraper: { width: 400, height: 2000, depth: 400, color: '#64748b', properties: { glass: true } },
    bridge: { width: 200, height: 20, depth: 1000, color: '#475569', properties: { length: 50 } },
    fountain: { width: 150, height: 100, depth: 150, color: '#60a5fa', properties: { waterHeight: 2 } },
    bench: { width: 120, height: 40, depth: 40, color: '#78350f', properties: { seats: 3 } },
    barrel: { width: 40, height: 60, depth: 40, color: '#92400e', properties: { explosive: true } },
    chest: { width: 60, height: 40, depth: 40, color: '#fbbf24', properties: { loot: 'coins' } },
};

export const ENVIRONMENT_PRESETS = {
    empty: { label: 'Empty Plain', skybox: 'sunset', groundType: 'grass', weather: 'none', fogDensity: 0, ambientLightIntensity: 0.5, fogColor: '#000000', cameraMode: 'thirdPerson', physicsEnabled: true },
    forest: { label: 'Deep Forest', skybox: 'forest', groundType: 'grass', weather: 'none', fogDensity: 0.01, ambientLightIntensity: 0.4, fogColor: '#064e3b', cameraMode: 'thirdPerson', physicsEnabled: true },
    city: { label: 'Metro City', skybox: 'city', groundType: 'concrete', weather: 'none', fogDensity: 0.005, ambientLightIntensity: 0.6, fogColor: '#334155', cameraMode: 'thirdPerson', physicsEnabled: true },
    desert: { label: 'Sand Dunes', skybox: 'dawn', groundType: 'sand', weather: 'none', fogDensity: 0.002, ambientLightIntensity: 0.8, fogColor: '#78350f', cameraMode: 'thirdPerson', physicsEnabled: true },
    arctic: { label: 'Arctic Waste', skybox: 'night', groundType: 'snow', weather: 'snow', fogDensity: 0.02, ambientLightIntensity: 0.3, fogColor: '#f8fafc', cameraMode: 'thirdPerson', physicsEnabled: true },
    ocean: { label: 'Open Ocean', skybox: 'sunset', groundType: 'water', weather: 'rain', fogDensity: 0.01, ambientLightIntensity: 0.5, fogColor: '#0c4a6e', cameraMode: 'thirdPerson', physicsEnabled: true },
    jungle: { label: 'Tropical Jungle', skybox: 'forest', groundType: 'grass', weather: 'rain', fogDensity: 0.015, ambientLightIntensity: 0.45, fogColor: '#065f46', cameraMode: 'thirdPerson', physicsEnabled: true },
    volcano: { label: 'Volcanic Peak', skybox: 'night', groundType: 'dirt', weather: 'storm', fogDensity: 0.025, ambientLightIntensity: 0.3, fogColor: '#450a0a', cameraMode: 'thirdPerson', physicsEnabled: true },
};

export const PREFABS: Prefab[] = [
    // Characters
    {
        name: 'Hero Player',
        type: 'player',
        category: 'characters',
        width: 1, height: 2, depth: 1,
        color: '#3b82f6',
        properties: { health: 100, speed: 5 },
        components: [
            { id: 'move-1', type: 'movement', enabled: true, props: { speed: 5 } }
        ]
    },
    {
        name: 'Patrolling Guard',
        type: 'enemy',
        category: 'characters',
        width: 1, height: 2, depth: 1,
        color: '#ef4444',
        properties: { damage: 20 },
        components: [
            { id: 'ai-1', type: 'ai', enabled: true, props: { behavior: 'patrol', speed: 2 } }
        ]
    },
    // Nature
    {
        name: 'Pine Tree',
        type: 'tree',
        category: 'nature',
        width: 2, height: 5, depth: 2,
        color: '#15803d',
        properties: { type: 'pine' }
    },
    {
        name: 'Large Rock',
        type: 'rock',
        category: 'nature',
        width: 3, height: 2, depth: 3,
        color: '#57534e',
        properties: { physics: true, mass: 500 }
    },
    {
        name: 'Bush',
        type: 'bush',
        category: 'nature',
        width: 1.5, height: 1, depth: 1.5,
        color: '#166534',
        properties: {}
    },
    // Urban
    {
        name: 'Modern House',
        type: 'house',
        category: 'urban',
        width: 10, height: 8, depth: 10,
        color: '#92400e',
        properties: {}
    },
    {
        name: 'Street Lamp',
        type: 'lamp',
        category: 'urban',
        width: 0.5, height: 4, depth: 0.5,
        color: '#1e293b',
        properties: { lightIntensity: 2, lightColor: '#fbbf24' }
    },
    // Props
    {
        name: 'Explosive Barrel',
        type: 'barrel',
        category: 'props',
        width: 0.8, height: 1.2, depth: 0.8,
        color: '#ef4444',
        properties: { explosive: true, damage: 100 },
        components: [
            { id: 'physics-1', type: 'physics', enabled: true, props: { mass: 10, friction: 0.5 } }
        ]
    },
    {
        name: 'Treasure Chest',
        type: 'chest',
        category: 'props',
        width: 1, height: 0.8, depth: 0.8,
        color: '#fbbf24',
        properties: { loot: 'gold', locked: false },
        components: [
            { id: 'inter-1', type: 'interaction', enabled: true, props: { radius: 2, message: 'Open Chest' } }
        ]
    }
];
