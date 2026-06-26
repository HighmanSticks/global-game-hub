const planck = require('planck-js');

// Flash used 30 pixels per Box2D meter
const SCALE = 30; 

// ==========================================
// 1. PHYSICS TRANSLATION HELPERS
// ==========================================

function createGroundBox(world, x, y, angle, width, height) {
    const body = world.createBody({ 
        type: 'static', 
        position: planck.Vec2(x, y), 
        angle: angle 
    });
    // Planck Box takes HALF-width and HALF-height
    body.createFixture(planck.Box(width / 2, height / 2), { friction: 0.5, restitution: 0.0 });
    return body;
}

function createGroundPolygon(world, x, y, angle, vertices) {
    const body = world.createBody({ 
        type: 'static', 
        position: planck.Vec2(x, y), 
        angle: angle 
    });
    const planckVerts = vertices.map(v => planck.Vec2(v[0], v[1]));
    body.createFixture(planck.Polygon(planckVerts), { friction: 0.5, restitution: 0.0 });
    return body;
}

function createGroundCircle(world, x, y, radius) {
    const body = world.createBody({ type: 'static', position: planck.Vec2(x, y) });
    body.createFixture(planck.Circle(radius), { friction: 0.5, restitution: 0.0 });
    return body;
}

// NEW: Spawns destructible, punchable items on the server
function createDynamicObject(room, id, x, y, width, height, isHeavy = false) {
    const body = room.world.createDynamicBody({
        position: planck.Vec2(x, y),
        linearDamping: 2.0, // Prevents infinite sliding
        angularDamping: 2.0
    });
    
    body.createFixture(planck.Box(width / 2, height / 2), { 
        density: isHeavy ? 2.0 : 1.0, 
        friction: 0.5, 
        restitution: 0.2 // Slight bounce
    });
    
    // Store it in the room's object dictionary so server.js can broadcast its coordinates
    room.objects[id] = body;
    return body;
}

// ==========================================
// 2. THE MASTER MAP BUILDER
// ==========================================

function loadMap(room, mapId) {
    console.log(`[MapLoader] Constructing FULL physics geometry & items for Map ID: ${mapId}`);

    switch(mapId) {
        case 1: buildMapTutorial(room); break;
        case 2: buildMapStorage(room); break;
        case 3: buildMapRooftops(room); break;
        case 4: buildMapPoliceStation(room); break;
        case 5: buildMapHazardous(room); break;
        case 6: buildMapBackstreets(room); break;
        case 7: buildMapTestingFloor(room); break;
        case 8: buildMapDuelArena(room); break;
        case 10: buildMapSurvival01(room); break;
        case 11: buildMapSurvivalArena(room); break;
        default: 
            console.log(`Map ${mapId} missing or deprecated. Defaulting to Duel Arena.`);
            buildMapDuelArena(room); 
            break;
    }
}

// ==========================================
// 3. MAP BLUEPRINTS (Static Walls + Dynamic Crates)
// ==========================================

function buildMapTutorial(room) {
    createGroundBox(room.world, -34/SCALE, 105/SCALE, 0, 110/SCALE, 358/SCALE);
    createGroundBox(room.world, 196/SCALE, -35/SCALE, 0, 452/SCALE, 104/SCALE);
    createGroundBox(room.world, 183.5/SCALE, 254/SCALE, 0, 469/SCALE, 92/SCALE);
    createGroundBox(room.world, 389/SCALE, 103/SCALE, 0, 122/SCALE, 381/SCALE);
}

function buildMapStorage(room) {
    // Static Architecture
    createGroundBox(room.world, 176.5/SCALE, 26.5/SCALE, 0, 351/SCALE, 51/SCALE);
    createGroundBox(room.world, 431/SCALE, 41.5/SCALE, 0, 184/SCALE, 81/SCALE);
    createGroundBox(room.world, 345/SCALE, 94/SCALE, 0, 12/SCALE, 24/SCALE);
    createGroundBox(room.world, 495/SCALE, 99.5/SCALE, 0, 56/SCALE, 35/SCALE);
    createGroundBox(room.world, 411.5/SCALE, 147/SCALE, 0, 145/SCALE, 12/SCALE);
    createGroundBox(room.world, 503.5/SCALE, 153/SCALE, 0, 39/SCALE, 72/SCALE);
    createGroundBox(room.world, 495/SCALE, 259/SCALE, 0, 56/SCALE, 140/SCALE);
    createGroundBox(room.world, 475.5/SCALE, 159/SCALE, 0, 17/SCALE, 12/SCALE);
    createGroundBox(room.world, 27.5/SCALE, 190.5/SCALE, 0, 53/SCALE, 277/SCALE);
    createGroundBox(room.world, 104.5/SCALE, 120/SCALE, 0, 73/SCALE, 18/SCALE);
    createGroundBox(room.world, 90.5/SCALE, 292/SCALE, 0, 73/SCALE, 74/SCALE);
    createGroundBox(room.world, 230.5/SCALE, 301/SCALE, 0, 147/SCALE, 56/SCALE);
    createGroundPolygon(room.world, 143/SCALE, 294/SCALE, 0, [[-16/SCALE,-39/SCALE], [-10/SCALE,-39/SCALE], [14/SCALE,-21/SCALE], [14/SCALE,35/SCALE], [-16/SCALE,35/SCALE]]);
    createGroundBox(room.world, 400.5/SCALE, 292/SCALE, 0, 133/SCALE, 74/SCALE);
    createGroundPolygon(room.world, 320/SCALE, 292/SCALE, 0, [[-16/SCALE,-19/SCALE], [8/SCALE,-37/SCALE], [14/SCALE,-37/SCALE], [14/SCALE,37/SCALE], [-16/SCALE,37/SCALE]]);
    
    // Dynamic Objects (Crates, Barrels, Gas Cans extracted from your code)
    createDynamicObject(room, "crate_1", 281.5/SCALE, 136/SCALE, 30/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_2", 230/SCALE, 137/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_1", 351/SCALE, 203/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_3", 259/SCALE, 137/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_2", 261/SCALE, 244/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_4", 213/SCALE, 200/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_3", 183/SCALE, 243/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_5", 443.5/SCALE, 248/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_6", 431/SCALE, 247/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_4", 96/SCALE, 247/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_7", 109/SCALE, 103/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_8", 94/SCALE, 104/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_9", 429/SCALE, 203/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_10", 404/SCALE, 182/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_5", 260/SCALE, 200/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "barrel_6", 132/SCALE, 174/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_11", 101/SCALE, 174/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_12", 221/SCALE, 221/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_13", 211/SCALE, 266/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_14", 355/SCALE, 247/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_7", 375/SCALE, 247/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_15", 392/SCALE, 226/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_16", 390/SCALE, 203/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_17", 221/SCALE, 243/SCALE, 30/SCALE, 30/SCALE);
}

function buildMapRooftops(room) {
    // Static Architecture
    createGroundBox(room.world, 103.5/SCALE, 157/SCALE, 0, 167/SCALE, 124/SCALE);
    createGroundBox(room.world, 39/SCALE, 74/SCALE, 0, 38/SCALE, 42/SCALE);
    createGroundBox(room.world, 68/SCALE, 63/SCALE, 0, 20/SCALE, 20/SCALE);
    createGroundBox(room.world, 43.5/SCALE, 237/SCALE, 0, 47/SCALE, 36/SCALE);
    createGroundBox(room.world, 33.5/SCALE, 267/SCALE, 0, 27/SCALE, 24/SCALE);
    createGroundBox(room.world, 103.5/SCALE, 319/SCALE, 0, 167/SCALE, 82/SCALE);
    createGroundBox(room.world, 265.5/SCALE, 323/SCALE, 0, 47/SCALE, 78/SCALE);
    createGroundBox(room.world, 429.5/SCALE, 332/SCALE, 0, 223/SCALE, 60/SCALE);
    createGroundPolygon(room.world, 304/SCALE, 311/SCALE, 0, [[-15/SCALE,-27/SCALE], [-10/SCALE,-27/SCALE], [14/SCALE,-9/SCALE], [14/SCALE,51/SCALE], [-15/SCALE,51/SCALE]]);
    createGroundBox(room.world, 180.5/SCALE, 231/SCALE, 0, 13/SCALE, 24/SCALE);
    createGroundBox(room.world, 274.5/SCALE, 200.5/SCALE, 0, 65/SCALE, 13/SCALE);
    createGroundBox(room.world, 248.5/SCALE, 228/SCALE, 0, 13/SCALE, 42/SCALE);
    createGroundBox(room.world, 380/SCALE, 200.5/SCALE, 0, 24/SCALE, 13/SCALE);
    createGroundBox(room.world, 468/SCALE, 200.5/SCALE, 0, 30/SCALE, 13/SCALE);
    createGroundBox(room.world, 493/SCALE, 162/SCALE, 0, 20/SCALE, 20/SCALE);
    createGroundBox(room.world, 522/SCALE, 173/SCALE, 0, 38/SCALE, 42/SCALE);
    createGroundBox(room.world, 512/SCALE, 236.5/SCALE, 0, 58/SCALE, 85/SCALE);
    createGroundBox(room.world, 522/SCALE, 290.5/SCALE, 0, 38/SCALE, 23/SCALE);
    createGroundBox(room.world, 155/SCALE, 380/SCALE, 0, 64/SCALE, 40/SCALE);
    createGroundBox(room.world, 269/SCALE, 381/SCALE, 0, 54/SCALE, 38/SCALE);

    // Dynamic Objects
    createDynamicObject(room, "crate_1", 302/SCALE, 74/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_2", 224/SCALE, 278/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_3", 269/SCALE, 187/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_4", 261/SCALE, 73/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_5", 334/SCALE, 295/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_6", 352/SCALE, 295/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_7", 376/SCALE, 295/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_8", 344/SCALE, 281/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_9", 413/SCALE, 295/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_10", 431/SCALE, 295/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_11", 423/SCALE, 281/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_12", 283/SCALE, 277/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_13", 531/SCALE, 145/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_14", 491/SCALE, 145/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_15", 511/SCALE, 145/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_16", 30/SCALE, 46/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_17", 49/SCALE, 46/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_18", 113/SCALE, 88/SCALE, 30/SCALE, 30/SCALE);
}

function buildMapPoliceStation(room) {
    createGroundBox(room.world, 302.5/SCALE, 413/SCALE, 0, 369/SCALE, 70/SCALE);
    createGroundBox(room.world, 590/SCALE, 407/SCALE, 0, 230/SCALE, 82/SCALE);
    createGroundPolygon(room.world, 719/SCALE, 409/SCALE, 0, [[-14/SCALE,-43/SCALE], [-10/SCALE,-43/SCALE], [14/SCALE,-25/SCALE], [14/SCALE,39/SCALE], [-14/SCALE,39/SCALE]]);
    createGroundBox(room.world, 818.5/SCALE, 416/SCALE, 0, 171/SCALE, 64/SCALE);
    createGroundBox(room.world, 886/SCALE, 372/SCALE, 0, 36/SCALE, 24/SCALE);
    createGroundBox(room.world, 876/SCALE, 309/SCALE, 0, 56/SCALE, 102/SCALE);
    createGroundBox(room.world, 876/SCALE, 117.5/SCALE, 0, 56/SCALE, 233/SCALE);
    createGroundBox(room.world, 886/SCALE, 246/SCALE, 0, 36/SCALE, 24/SCALE);
    createGroundBox(room.world, 822/SCALE, 163/SCALE, 0, 52/SCALE, 34/SCALE);
    createGroundBox(room.world, 777/SCALE, 174/SCALE, 0, 38/SCALE, 12/SCALE);
    createGroundBox(room.world, 637.5/SCALE, 174/SCALE, 0, 171/SCALE, 12/SCALE);
    createGroundBox(room.world, 716.5/SCALE, 200/SCALE, 0, 13/SCALE, 40/SCALE);
    createGroundBox(room.world, 558.5/SCALE, 201/SCALE, 0, 13/SCALE, 42/SCALE);
    createGroundBox(room.world, 629/SCALE, 276/SCALE, 0, 154/SCALE, 36/SCALE);
    createGroundBox(room.world, 777/SCALE, 282/SCALE, 0, 142/SCALE, 48/SCALE);
    createGroundBox(room.world, 558.5/SCALE, 312/SCALE, 0, 13/SCALE, 36/SCALE);
    createGroundBox(room.world, 712.5/SCALE, 321/SCALE, 0, 13/SCALE, 30/SCALE);
    createGroundBox(room.world, 125/SCALE, 341.5/SCALE, 0, 14/SCALE, 73/SCALE);
    createGroundBox(room.world, 663/SCALE, 302.5/SCALE, 0, 8/SCALE, 17/SCALE);
    createGroundBox(room.world, 662.5/SCALE, 359.5/SCALE, 0, 15/SCALE, 13/SCALE);
    createGroundBox(room.world, 877/SCALE, -43.5/SCALE, 0, 58/SCALE, 89/SCALE);

    // Dynamic Crates & Barrels
    createDynamicObject(room, "crate_1", 388/SCALE, 371/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_2", 404/SCALE, 371/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_3", 397/SCALE, 356/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_1", 429/SCALE, 371/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_4", 308/SCALE, 264/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_5", 219/SCALE, 308/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_6", 234/SCALE, 308/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_7", 228/SCALE, 293/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_8", 251/SCALE, 264/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_9", 292/SCALE, 264/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_10", 660/SCALE, 251/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_11", 577/SCALE, 251/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_12", 690/SCALE, 251/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_13", 707/SCALE, 251/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_14", 767/SCALE, 229/SCALE, 30/SCALE, 30/SCALE);
}

function buildMapHazardous(room) {
    createGroundBox(room.world, 389.5/SCALE, 305/SCALE, 0, 73/SCALE, 18/SCALE); 
    createGroundBox(room.world, 566/SCALE, 307/SCALE, 0, 106/SCALE, 14/SCALE);
    createGroundBox(room.world, 492/SCALE, 180/SCALE, 0, 150/SCALE, 12/SCALE);
    createGroundBox(room.world, 592/SCALE, 225/SCALE, 0, 50/SCALE, 102/SCALE);
    createGroundBox(room.world, 603/SCALE, 288/SCALE, 0, 28/SCALE, 24/SCALE);
    createGroundBox(room.world, 602/SCALE, 162/SCALE, 0, 30/SCALE, 24/SCALE);
    createGroundBox(room.world, 592/SCALE, 123.5/SCALE, 0, 50/SCALE, 53/SCALE);
    createGroundBox(room.world, 517/SCALE, 49/SCALE, 0, 200/SCALE, 96/SCALE);
    createGroundBox(room.world, 423.5/SCALE, 117.5/SCALE, 0, 13/SCALE, 41/SCALE);
    createGroundBox(room.world, 296/SCALE, 17.5/SCALE, 0, 242/SCALE, 33/SCALE);
    createGroundBox(room.world, 168.5/SCALE, 76.5/SCALE, 0, 13/SCALE, 35/SCALE);
    createGroundBox(room.world, 88/SCALE, 30/SCALE, 0, 174/SCALE, 58/SCALE);
    createGroundBox(room.world, 18/SCALE, 82.5/SCALE, 0, 34/SCALE, 47/SCALE);
    createGroundBox(room.world, 8/SCALE, 118/SCALE, 0, 14/SCALE, 24/SCALE);
    createGroundBox(room.world, 88/SCALE, 136/SCALE, 0, 174/SCALE, 12/SCALE);
    createGroundBox(room.world, 18/SCALE, 184/SCALE, 0, 34/SCALE, 84/SCALE);
    createGroundBox(room.world, 8/SCALE, 238/SCALE, 0, 14/SCALE, 24/SCALE);
    createGroundBox(room.world, 22/SCALE, 282/SCALE, 0, 42/SCALE, 64/SCALE);
    createGroundBox(room.world, 126/SCALE, 300/SCALE, 0, 58/SCALE, 28/SCALE);
    createGroundPolygon(room.world, 66/SCALE, 289/SCALE, 0, [[-23/SCALE,-39/SCALE], [-18/SCALE,-39/SCALE], [31/SCALE,-3/SCALE], [31/SCALE,24/SCALE], [-23/SCALE,24/SCALE]]);
    
    // Dynamic Objects
    createDynamicObject(room, "crate_1", 528/SCALE, 293/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_2", 544/SCALE, 293/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_3", 537/SCALE, 277/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_4", 123/SCALE, 279/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_5", 139/SCALE, 279/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_6", 325/SCALE, 289/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_7", 343/SCALE, 289/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_8", 61/SCALE, 123/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_9", 79/SCALE, 123/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_10", 120/SCALE, 123/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_11", 139/SCALE, 123/SCALE, 30/SCALE, 30/SCALE);
}

function buildMapBackstreets(room) {
    createGroundBox(room.world, 517.5/SCALE, 41/SCALE, 0, 171/SCALE, 12/SCALE);
    createGroundBox(room.world, 117/SCALE, 31/SCALE, 0, 182/SCALE, 12/SCALE);
    createGroundBox(room.world, 30/SCALE, 67/SCALE, 0, 46/SCALE, 60/SCALE);
    createGroundBox(room.world, 20.5/SCALE, 109/SCALE, 0, 27/SCALE, 24/SCALE);
    createGroundBox(room.world, 30/SCALE, 165/SCALE, 0, 46/SCALE, 88/SCALE);
    createGroundBox(room.world, 130.5/SCALE, 127/SCALE, 0, 155/SCALE, 12/SCALE);
    createGroundBox(room.world, 201.5/SCALE, 144/SCALE, 0, 13/SCALE, 22/SCALE);
    createGroundBox(room.world, 63/SCALE, 159/SCALE, 0, 20/SCALE, 52/SCALE);
    createGroundBox(room.world, 53/SCALE, 225/SCALE, 0, 92/SCALE, 32/SCALE);
    createGroundBox(room.world, 168/SCALE, 216/SCALE, 0, 80/SCALE, 50/SCALE);
    createGroundBox(room.world, 268/SCALE, 226/SCALE, 0, 40/SCALE, 30/SCALE);
    createGroundBox(room.world, 374/SCALE, 216/SCALE, 0, 90/SCALE, 50/SCALE);
    createGroundBox(room.world, 502.5/SCALE, 210/SCALE, 0, 167/SCALE, 62/SCALE);
    createGroundBox(room.world, 572/SCALE, 113/SCALE, 0, 28/SCALE, 132/SCALE);
    createGroundBox(room.world, 334.5/SCALE, 148/SCALE, 0, 13/SCALE, 20/SCALE);
    createGroundBox(room.world, 334.5/SCALE, 88/SCALE, 0, 13/SCALE, 22/SCALE);
    createGroundBox(room.world, 386.5/SCALE, 83/SCALE, 0, 91/SCALE, 12/SCALE);
    createGroundBox(room.world, 438.5/SCALE, 68/SCALE, 0, 13/SCALE, 42/SCALE);
    createGroundBox(room.world, 201.5/SCALE, 61/SCALE, 0, 13/SCALE, 48/SCALE);
    createGroundPolygon(room.world, 115/SCALE, 223/SCALE, 0, [[-16/SCALE,-14/SCALE], [8/SCALE,-32/SCALE], [13/SCALE,-32/SCALE], [13/SCALE,18/SCALE], [-16/SCALE,18/SCALE]]);
    createGroundPolygon(room.world, 228/SCALE, 224/SCALE, 0, [[-20/SCALE,-33/SCALE], [20/SCALE,-13/SCALE], [20/SCALE,17/SCALE], [-20/SCALE,17/SCALE]]);
    createGroundPolygon(room.world, 310/SCALE, 223/SCALE, 0, [[-22/SCALE,-12/SCALE], [19/SCALE,-32/SCALE], [19/SCALE,18/SCALE], [-22/SCALE,18/SCALE]]);
    createGroundBox(room.world, 16/SCALE, 31/SCALE, 0, 20/SCALE, 12/SCALE);

    // Dynamic Objects
    createDynamicObject(room, "crate_1", 100/SCALE, 114/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_2", 115/SCALE, 114/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_3", 113/SCALE, 99/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_4", 153/SCALE, 114/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_5", 168/SCALE, 114/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_6", 441/SCALE, 131/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_7", 181/SCALE, 184/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_8", 166/SCALE, 184/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "barrel_1", 93.5/SCALE, 205.5/SCALE, 20/SCALE, 30/SCALE, true);
    createDynamicObject(room, "crate_9", 361/SCALE, 184/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_10", 346/SCALE, 184/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_11", 478/SCALE, 172.5/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_12", 551/SCALE, 172/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_13", 536/SCALE, 172/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_14", 551/SCALE, 157/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_15", 354.5/SCALE, 131.5/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_16", 372/SCALE, 70/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_17", 357/SCALE, 70/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_18", 424/SCALE, 70/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_19", 409/SCALE, 70/SCALE, 30/SCALE, 30/SCALE);
}

function buildMapTestingFloor(room) {
    createGroundBox(room.world, 90/SCALE, 42.5/SCALE, 0, 178/SCALE, 83/SCALE);
    createGroundBox(room.world, 320.5/SCALE, 42/SCALE, 0, 149/SCALE, 82/SCALE);
    createGroundBox(room.world, 592/SCALE, 42/SCALE, 0, 260/SCALE, 82/SCALE);
    createGroundBox(room.world, 212/SCALE, -14/SCALE, 0, 139/SCALE, 38/SCALE);
    createGroundBox(room.world, 428/SCALE, -13/SCALE, 0, 123/SCALE, 35/SCALE);
    createGroundBox(room.world, 663/SCALE, 137/SCALE, 0, 118/SCALE, 108/SCALE);
    createGroundBox(room.world, 683/SCALE, 221/SCALE, 0, 78/SCALE, 60/SCALE);
    createGroundBox(room.world, 587.5/SCALE, 263/SCALE, 0, 269/SCALE, 24/SCALE);
    createGroundBox(room.world, 0.5/SCALE, 137.5/SCALE, 0, 71/SCALE, 107/SCALE);
    createGroundBox(room.world, 72.5/SCALE, 263/SCALE, 0, 232/SCALE, 24/SCALE);
    createGroundBox(room.world, -24/SCALE, 221/SCALE, 0, 39/SCALE, 60/SCALE);
    createGroundBox(room.world, 320/SCALE, 243.5/SCALE, 0, 150/SCALE, 63/SCALE);
    createGroundPolygon(room.world, 217/SCALE, 254/SCALE, 0, [[-29/SCALE,-3/SCALE], [23/SCALE,-42/SCALE], [28/SCALE,-42/SCALE], [28/SCALE,21/SCALE], [-29/SCALE,21/SCALE]]);
    createGroundPolygon(room.world, 422/SCALE, 252/SCALE, 0, [[-22/SCALE,-40/SCALE], [31/SCALE,-1/SCALE], [31/SCALE,23/SCALE], [-27/SCALE,23/SCALE], [-27/SCALE,-40/SCALE]]);
    createGroundBox(room.world, 624/SCALE, 221/SCALE, 0, 40/SCALE, 60/SCALE);
    createGroundBox(room.world, 15.5/SCALE, 221/SCALE, 0, 41/SCALE, 60/SCALE);
    createGroundBox(room.world, 339/SCALE, 300/SCALE, 0, 766/SCALE, 50/SCALE);

    // Dynamic Objects
    createDynamicObject(room, "crate_1", 190/SCALE, 62/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_2", 212/SCALE, 61/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_3", 237/SCALE, 61/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_4", 229/SCALE, 46/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_5", 201/SCALE, 45/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_6", 410/SCALE, 46/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_7", 446/SCALE, 46/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_8", 409/SCALE, 61/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_9", 445/SCALE, 61/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_10", 428/SCALE, 60/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_11", 61/SCALE, 178/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_12", 189/SCALE, 137/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_13", 145/SCALE, 244/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_14", 168/SCALE, 244/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_15", 78/SCALE, 222/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_16", 78/SCALE, 200/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_17", 59/SCALE, 244/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_18", 252/SCALE, 205/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_19", 387/SCALE, 205/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_20", 525/SCALE, 221/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_21", 581/SCALE, 178/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_22", 567/SCALE, 178/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_23", 154/SCALE, 138/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_24", 485/SCALE, 138/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_25", 451/SCALE, 138/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_26", 519/SCALE, 178/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_27", 593/SCALE, 244/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_28", 43/SCALE, 244/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_29", 45/SCALE, 178/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_30", 285/SCALE, 183/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_31", 357/SCALE, 183/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_32", 372/SCALE, 205/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_33", 267/SCALE, 205/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_34", 559/SCALE, 200/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_35", 115/SCALE, 178/SCALE, 30/SCALE, 30/SCALE);
}

function buildMapDuelArena(room) {
    createGroundBox(room.world, 300/SCALE, 350/SCALE, 0, 600/SCALE, 50/SCALE);
    createGroundBox(room.world, 300/SCALE, 50/SCALE, 0, 600/SCALE, 50/SCALE);
    createGroundBox(room.world, 25/SCALE, 200/SCALE, 0, 50/SCALE, 400/SCALE);
    createGroundBox(room.world, 575/SCALE, 200/SCALE, 0, 50/SCALE, 400/SCALE);
    createGroundPolygon(room.world, 106/SCALE, 295/SCALE, 0, [[44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    createGroundPolygon(room.world, 194/SCALE, 295/SCALE, 0, [[-44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    createGroundPolygon(room.world, 406/SCALE, 295/SCALE, 0, [[44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    createGroundPolygon(room.world, 494/SCALE, 295/SCALE, 0, [[-44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    
    // Dynamic Crates Specific to Duel Arena
    createDynamicObject(room, "crate_1", 240/SCALE, 310/SCALE, 30/SCALE, 30/SCALE);
    createDynamicObject(room, "crate_2", 360/SCALE, 310/SCALE, 30/SCALE, 30/SCALE);
}

function buildMapSurvival01(room) {
    buildMapTestingFloor(room);
    createGroundBox(room.world, 320/SCALE, 361.5/SCALE, 0, 570/SCALE, 43/SCALE);
    createGroundBox(room.world, 319.5/SCALE, 307.5/SCALE, 0, 9/SCALE, 65/SCALE);
}

function buildMapSurvivalArena(room) {
    buildMapDuelArena(room);
}

module.exports = { loadMap };
