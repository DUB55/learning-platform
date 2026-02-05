export type GameMode = '2d' | '3d';
export type ObjectType = 'player' | 'platform' | 'enemy' | 'goal' | 'coin' | 'hazard' | 'trigger' | 'light' | 'model' | 'character' | 'car' | 'house' | 'tree' | 'building' | 'fence' | 'rock' | 'crate' | 'lamp' | 'particle' | 'flower' | 'bush' | 'mushroom' | 'skyscraper' | 'bridge' | 'fountain' | 'bench' | 'barrel' | 'chest';

export interface GameObject {
    id: string;
    type: ObjectType;
    x: number;
    y: number;
    z?: number; // 3D
    width: number;
    height: number;
    depth?: number; // 3D
    rotation?: [number, number, number]; // 3D
    color: string;
    properties: Record<string, any>;
    components?: GameComponent[];
}

export type ComponentType = 'movement' | 'ai' | 'interaction' | 'physics' | 'health' | 'inventory' | 'weapon';

export interface GameComponent {
    id: string;
    type: ComponentType;
    enabled: boolean;
    props: Record<string, any>;
}

export interface GameLogic {
    id: string;
    trigger: 'onStart' | 'onUpdate' | 'onCollision' | 'onTriggerEnter' | 'onTriggerExit' | 'onInteract' | 'onPointsReached' | 'onTimer';
    action: 'message' | 'teleport' | 'spawn' | 'destroy' | 'win' | 'lose' | 'score' | 'changeWeather' | 'changeTime' | 'playEffect';
    targetId?: string;
    params: Record<string, any>;
}

export interface GameDesign {
    id: string;
    title: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    isPublished?: boolean;
    mode: GameMode;
    objects: GameObject[];
    logic: GameLogic[];
    settings: {
        gravity: number | [number, number, number];
        jumpForce: number;
        moveSpeed: number;
        backgroundColor: string;
        viewportWidth: number;
        viewportHeight: number;
        // 3D Specific
        skybox?: string;
        fogColor?: string;
        fogDensity?: number;
        ambientLightIntensity?: number;
        weather?: 'none' | 'rain' | 'snow' | 'sun' | 'storm';
        groundType?: 'grass' | 'snow' | 'sand' | 'concrete' | 'dirt' | 'water';
        environment?: 'empty' | 'city' | 'forest' | 'jungle' | 'mountains' | 'ocean';
        timeOfDay?: number; // 0-24
        dayNightCycle?: boolean;
        physicsEnabled?: boolean;
        cameraMode?: 'firstPerson' | 'thirdPerson' | 'topDown' | 'orbit';
        cameraDistance?: number;
        winCondition?: 'reachGoal' | 'collectAll' | 'scoreLimit' | 'timer';
        winValue?: number;
        loseCondition?: 'healthZero' | 'fallOff' | 'timer';
        loseValue?: number;
        rendering?: {
            bloom?: {
                enabled: boolean;
                intensity: number;
                threshold: number;
            };
            ssao?: {
                enabled: boolean;
                intensity: number;
                radius: number;
            };
            vignette?: {
                enabled: boolean;
                offset: number;
                darkness: number;
            };
            ssr?: {
                enabled: boolean;
            };
            tonemapping?: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
        };
    };
}

export type AssetCategory = 'characters' | 'nature' | 'urban' | 'props' | 'interactive' | 'vfx';

export interface Prefab extends Omit<GameObject, 'id' | 'x' | 'y' | 'z'> {
    name: string;
    category: AssetCategory;
    thumbnail?: string;
    description?: string;
}
