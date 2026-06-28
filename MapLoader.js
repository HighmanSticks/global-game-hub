const fs = require('fs');
const path = require('path');
const planck = require('planck-js');

// Flash used 30 pixels per Box2D meter.
const SCALE = 30;

const TIME_STEP = 1 / 24;
const VELOCITY_ITERATIONS = 8;
const POSITION_ITERATIONS = 20;
const GRAVITY = planck.Vec2(0, 10);

const MAP_FUNCTIONS = {
    1: 'GenerateMapTutorial',
    2: 'GenerateMapStorage',
    3: 'GenerateMapRooftops',
    4: 'GenerateMapPoliceStation',
    5: 'GenerateMapHazardous',
    6: 'GenerateMapBackstreets',
    7: 'GenerateMapTestingFloor',
    8: 'GenerateMapDuelArena',
    10: 'GenerateMapSurvival01',
    11: 'GenerateMapSurvivalArena',
};

const DEFAULT_MAPS_AS = path.join(__dirname, 'Code', 'Handler', 'Maps.as');

const COLLISION = {
    SOLID: 0x0001,
    LADDER: 0x0002,
    PLAYER: 0x0004,
    DYNAMIC: 0x0008,
};

const RENDER_COLORS = {
    ground: 0xff00ff,
    metal: 0xff00ff,
    cloud: 0xff0086,
    ladder: 0xff6696,
    dynamic: 0x00ff00,
};

const MATERIALS = {
    ground: { friction: 0.5, restitution: 0.2, density: 1 },
    metal: { friction: 0.4, restitution: 0.1, density: 10 },
    wood: { friction: 0.6, restitution: 0.3, density: 3 },
};

// ==========================================
// Maps.as parser (single source of truth)
// ==========================================

function evalFlashExpr(expr) {
    const cleaned = expr.trim().replace(/\s+/g, ' ');
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${cleaned});`)();
}

function extractFunctionBody(source, fnName) {
    const sig = `private function ${fnName}`;
    const start = source.indexOf(sig);
    if (start < 0) {
        throw new Error(`Could not find ${fnName} in Maps.as`);
    }

    let i = source.indexOf('{', start);
    let depth = 0;
    for (; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') {
            depth--;
            if (depth === 0) return source.slice(start, i + 1);
        }
    }
    throw new Error(`Unbalanced braces in ${fnName}`);
}

function parsePolygonVerts(raw) {
    const verts = [];
    const re = /\[([^\]]+)\]/g;
    let m;
    while ((m = re.exec(raw))) {
        const parts = m[1].split(',').map((p) => evalFlashExpr(p));
        verts.push([parts[0], parts[1]]);
    }
    return verts;
}

function parseGroundCalls(functionBody) {
    const shapes = [];

    const boxRe = /CreateGroundBox\(Handler_WorldItems\.Material\.(\w+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*new Array\("(\w+)"\)\)/g;
    const polyRe = /CreateGroundPolygon\(Handler_WorldItems\.Material\.(\w+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*new Array\(([^)]*)\),\s*new Array\("(\w+)"\)\)/g;
    const circleRe = /CreateGroundCircle\(Handler_WorldItems\.Material\.(\w+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*new Array\("(\w+)"\)\)/g;

    let m;
    while ((m = boxRe.exec(functionBody))) {
        shapes.push({
            type: 'box',
            material: m[1].toLowerCase(),
            x: evalFlashExpr(m[2]),
            y: evalFlashExpr(m[3]),
            angle: evalFlashExpr(m[4]),
            width: evalFlashExpr(m[5]),
            height: evalFlashExpr(m[6]),
            special: m[7],
        });
    }
    while ((m = polyRe.exec(functionBody))) {
        shapes.push({
            type: 'poly',
            material: m[1].toLowerCase(),
            x: evalFlashExpr(m[2]),
            y: evalFlashExpr(m[3]),
            angle: evalFlashExpr(m[4]),
            verts: parsePolygonVerts(m[5]),
            special: m[6],
        });
    }
    while ((m = circleRe.exec(functionBody))) {
        shapes.push({
            type: 'circle',
            material: m[1].toLowerCase(),
            x: evalFlashExpr(m[2]),
            y: evalFlashExpr(m[3]),
            radius: evalFlashExpr(m[4]),
            special: m[5],
        });
    }

    return shapes;
}

function parseMapFromSource(source, mapId) {
    const fnName = MAP_FUNCTIONS[mapId];
    if (!fnName) return null;
    const body = extractFunctionBody(source, fnName);
    return parseGroundCalls(body);
}

function parseAllMapsFromSource(source) {
    const out = {};
    for (const mapId of Object.keys(MAP_FUNCTIONS)) {
        out[mapId] = parseMapFromSource(source, Number(mapId));
    }
    return out;
}

function loadMapGeometry(mapId, options = {}) {
    const geometryPath = options.geometryPath || path.join(__dirname, 'mapGeometry.json');
    const mapsAsPath = options.mapsAsPath || DEFAULT_MAPS_AS;

    if (options.geometry) return options.geometry;
    if (fs.existsSync(geometryPath)) {
        const cached = JSON.parse(fs.readFileSync(geometryPath, 'utf8'));
        if (cached[String(mapId)]) return cached[String(mapId)];
    }
    if (fs.existsSync(mapsAsPath)) {
        const source = fs.readFileSync(mapsAsPath, 'utf8');
        return parseMapFromSource(source, mapId) || [];
    }
    throw new Error(`No geometry found for map ${mapId}. Run: node tools/extractMapGeometry.js`);
}

// ==========================================
// Geometry helpers (match MapPremadeItems.as)
// ==========================================

function inflateBox(width, height) {
    return {
        width: width + 0.5 / SCALE,
        height: height + 0.5 / SCALE,
    };
}

function inflateCorners(verts) {
    return verts.map(([x, y]) => {
        let nx = x;
        let ny = y;
        if (x < 0) nx -= 0.5 / SCALE;
        else if (x > 0) nx += 0.5 / SCALE;
        if (y < 0) ny -= 0.5 / SCALE;
        else if (y > 0) ny += 0.5 / SCALE;
        return [nx, ny];
    });
}

function inflateCircle(radius) {
    return radius + 0.5 / SCALE;
}

function getMaterial(name) {
    return MATERIALS[name] || MATERIALS.ground;
}

function getRenderLayer(special) {
    if (special === 'CLOUD') return 'cloud';
    if (special === 'LADDER') return 'ladder';
    return 'ground';
}

function getRenderColor(material, special) {
    if (special === 'CLOUD') return RENDER_COLORS.cloud;
    if (special === 'LADDER') return RENDER_COLORS.ladder;
    return RENDER_COLORS[material] || RENDER_COLORS.ground;
}

function toPixelPoint(x, y) {
    return { x: x * SCALE, y: y * SCALE };
}

function buildRenderEntry(shape, body) {
    const pos = body.getPosition();
    const angle = body.getAngle();
    const layer = getRenderLayer(shape.special);
    const color = getRenderColor(shape.material, shape.special);

    if (shape.type === 'box') {
        const inflated = inflateBox(shape.width, shape.height);
        return {
            type: 'box',
            layer,
            color,
            material: shape.material,
            special: shape.special,
            x: pos.x * SCALE,
            y: pos.y * SCALE,
            width: inflated.width * SCALE,
            height: inflated.height * SCALE,
            angle,
            angleDeg: angle * (180 / Math.PI),
        };
    }

    if (shape.type === 'circle') {
        const r = inflateCircle(shape.radius);
        return {
            type: 'circle',
            layer,
            color,
            material: shape.material,
            special: shape.special,
            x: pos.x * SCALE,
            y: pos.y * SCALE,
            radius: r * SCALE,
        };
    }

    const verts = inflateCorners(shape.verts).map(([vx, vy]) => {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const wx = pos.x + vx * c - vy * s;
        const wy = pos.y + vx * s + vy * c;
        return toPixelPoint(wx, wy);
    });

    return {
        type: 'poly',
        layer,
        color,
        material: shape.material,
        special: shape.special,
        x: pos.x * SCALE,
        y: pos.y * SCALE,
        angle,
        angleDeg: angle * (180 / Math.PI),
        verts,
    };
}

function fixtureFilterForShape(shape) {
    const filter = {};
    if (shape.special === 'LADDER') {
        filter.categoryBits = COLLISION.LADDER;
        filter.maskBits = COLLISION.PLAYER | COLLISION.SOLID;
    } else {
        filter.categoryBits = COLLISION.SOLID;
        filter.maskBits = COLLISION.SOLID | COLLISION.PLAYER | COLLISION.DYNAMIC | COLLISION.LADDER;
    }
    return filter;
}

function installCloudContactFilter(world) {
    world.on('pre-solve', (contact) => {
        const fixtureA = contact.getFixtureA();
        const fixtureB = contact.getFixtureB();
        const bodyA = fixtureA.getBody();
        const bodyB = fixtureB.getBody();

        let cloudBody = null;
        let otherBody = null;

        if (bodyA.getUserData()?.isCloud) {
            cloudBody = bodyA;
            otherBody = bodyB;
        } else if (bodyB.getUserData()?.isCloud) {
            cloudBody = bodyB;
            otherBody = bodyA;
        } else {
            return;
        }

        if (otherBody.isStatic()) return;

        const angle = cloudBody.getAngle();
        const cloudPos = cloudBody.getPosition();
        const otherPos = otherBody.getPosition();
        const vel = otherBody.getLinearVelocity();

        if (angle !== 0) {
            const dx = cloudPos.x - otherPos.x;
            const dy = cloudPos.y - otherPos.y;
            const c = Math.cos(-angle);
            const s = Math.sin(-angle);
            const localX = dx * c + dy * -s;
            const localY = dx * s + dy * c;
            const localAngle = Math.atan2(localY, localX);
            if (localAngle < -0.35 && localAngle > -2.79) {
                contact.setEnabled(false);
            }
            return;
        }

        if (vel.y < 0) {
            if (cloudPos.y < otherPos.y - vel.y) {
                contact.setEnabled(false);
            }
        }
    });
}

function createPhysicsWorld() {
    const world = planck.World(GRAVITY);
    installCloudContactFilter(world);
    return world;
}

function spawnStaticShape(world, shape, renderList) {
    const mat = getMaterial(shape.material);
    const userData = {
        kind: 'static',
        material: shape.material,
        special: shape.special,
        isCloud: shape.special === 'CLOUD',
        isLadder: shape.special === 'LADDER',
    };

    const body = world.createBody({
        type: 'static',
        position: planck.Vec2(shape.x, shape.y),
        angle: shape.angle || 0,
        userData,
    });

    const filter = fixtureFilterForShape(shape);
    const fixtureOpts = {
        friction: mat.friction,
        restitution: mat.restitution,
        density: 0,
        filter,
    };

    if (shape.type === 'box') {
        const inflated = inflateBox(shape.width, shape.height);
        body.createFixture(planck.Box(inflated.width / 2, inflated.height / 2), fixtureOpts);
    } else if (shape.type === 'circle') {
        body.createFixture(planck.Circle(inflateCircle(shape.radius)), fixtureOpts);
    } else {
        const verts = inflateCorners(shape.verts).map((v) => planck.Vec2(v[0], v[1]));
        body.createFixture(planck.Polygon(verts), fixtureOpts);
    }

    renderList.push(buildRenderEntry(shape, body));
    return body;
}

function createDynamicObject(room, id, x, y, width, height, options = {}) {
    const mat = getMaterial(options.material || 'wood');
    const density = options.density != null ? options.density : (options.isHeavy ? 2.0 : 1.0);

    const body = room.world.createDynamicBody({
        position: planck.Vec2(x, y),
        linearDamping: 2.0,
        angularDamping: 2.0,
        userData: {
            kind: 'dynamic',
            id,
            width,
            height,
        },
    });

    body.createFixture(planck.Box(width / 2, height / 2), {
        density,
        friction: mat.friction,
        restitution: mat.restitution,
        filter: {
            categoryBits: COLLISION.DYNAMIC,
            maskBits: COLLISION.SOLID | COLLISION.DYNAMIC | COLLISION.PLAYER,
        },
    });

    room.objects[id] = body;
    room.dynamicRender[id] = {
        type: 'box',
        layer: 'dynamic',
        color: RENDER_COLORS.dynamic,
        width: width * SCALE,
        height: height * SCALE,
    };
    return body;
}

// ==========================================
// Room lifecycle + physics stepping
// ==========================================

function createRoom(mapId, options = {}) {
    const world = createPhysicsWorld();
    const room = {
        mapId,
        world,
        objects: {},
        players: {},
        staticRender: [],
        dynamicRender: {},
        time: 0,
        tick: 0,
    };

    loadMap(room, mapId, options);
    return room;
}

function loadMap(room, mapId, options = {}) {
    console.log(`[MapLoader] Building physics + render data for map ${mapId}`);

    room.mapId = mapId;
    
    // Safely initialize the array if it's missing, otherwise clear the existing one
    if (!room.staticRender) {
        room.staticRender = [];
    } else {
        room.staticRender.length = 0;
    }
    
    room.dynamicRender = {};
    room.objects = {};

    const shapes = loadMapGeometry(mapId, options);
    for (const shape of shapes) {
        spawnStaticShape(room.world, shape, room.staticRender);
    }

    spawnDefaultDynamics(room, mapId);
    return room;
}
function spawnDefaultDynamics(room, mapId) {
    // Optional deterministic crate/barrel spawns for maps that always place them.
    // Full AddObject(...) randomness from Maps.as is not replicated here.
    const defaults = DEFAULT_DYNAMIC_SPAWNS[mapId];
    if (!defaults) return;
    for (const obj of defaults) {
        createDynamicObject(room, obj.id, obj.x, obj.y, obj.w, obj.h, obj);
    }
}

function stepPhysics(room, dt = TIME_STEP) {
    room.world.step(dt, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
    room.time += dt;
    room.tick++;
}

function getDynamicSnapshot(room) {
    const objects = {};
    for (const [id, body] of Object.entries(room.objects)) {
        const pos = body.getPosition();
        objects[id] = {
            x: pos.x,
            y: pos.y,
            angle: body.getAngle(),
            px: pos.x * SCALE,
            py: pos.y * SCALE,
            angleDeg: body.getAngle() * (180 / Math.PI),
        };
    }
    return objects;
}

function getRenderSnapshot(room) {
    const dynamic = {};
    for (const [id, body] of Object.entries(room.objects)) {
        const pos = body.getPosition();
        const meta = room.dynamicRender[id] || {};
        dynamic[id] = {
            ...meta,
            x: pos.x * SCALE,
            y: pos.y * SCALE,
            angle: body.getAngle(),
            angleDeg: body.getAngle() * (180 / Math.PI),
        };
    }

    return {
        mapId: room.mapId,
        static: room.staticRender,
        dynamic,
    };
}

function getStatePacket(room) {
    return {
        tick: room.tick,
        time: room.time,
        objects: getDynamicSnapshot(room),
        players: Object.fromEntries(
            Object.entries(room.players).map(([id, p]) => [id, {
                x: p.x,
                y: p.y,
                vx: p.vx || 0,
                vy: p.vy || 0,
                facing: p.facing || 1,
            }])
        ),
    };
}

function querySolidAt(room, px, py) {
    const point = planck.Vec2(px / SCALE, py / SCALE);
    let hit = null;

    room.world.queryPoint(point, (fixture) => {
        const ud = fixture.getBody().getUserData() || {};
        if (ud.isLadder) return true;
        hit = fixture.getBody();
        return false;
    });

    return hit;
}

function applyImpulseToObject(room, objectId, impulseX, impulseY) {
    const body = room.objects[objectId];
    if (!body) return false;
    body.applyLinearImpulse(planck.Vec2(impulseX, impulseY), body.getWorldCenter(), true);
    body.setAwake(true);
    return true;
}

// Minimal always-present spawns (pixels converted to meters).
const DEFAULT_DYNAMIC_SPAWNS = {
    8: [
        { id: 'crate_1', x: 240 / SCALE, y: 310 / SCALE, w: 30 / SCALE, h: 30 / SCALE },
        { id: 'crate_2', x: 360 / SCALE, y: 310 / SCALE, w: 30 / SCALE, h: 30 / SCALE },
    ],
};

module.exports = {
    SCALE,
    TIME_STEP,
    VELOCITY_ITERATIONS,
    POSITION_ITERATIONS,
    GRAVITY,
    COLLISION,
    MATERIALS,
    MAP_FUNCTIONS,
    parseMapFromSource,
    parseAllMapsFromSource,
    loadMapGeometry,
    createPhysicsWorld,
    createRoom,
    loadMap,
    stepPhysics,
    getDynamicSnapshot,
    getRenderSnapshot,
    getStatePacket,
    querySolidAt,
    applyImpulseToObject,
    createDynamicObject,
    spawnStaticShape,
};
