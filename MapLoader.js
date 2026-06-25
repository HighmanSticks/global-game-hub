const planck = require('planck-js');

// The Golden Rule: Flash used 30 pixels per Box2D meter
const SCALE = 30; 

// --- PHYSICS TRANSLATION HELPERS ---
function createGroundBox(world, x, y, angle, width, height) {
    const body = world.createBody({ 
        type: 'static', 
        position: planck.Vec2(x, y), 
        angle: angle 
    });
    // Planck Box takes HALF-width and HALF-height!
    body.createFixture(planck.Box(width / 2, height / 2), { friction: 0.5, restitution: 0.0 });
    return body;
}

function createGroundPolygon(world, x, y, angle, vertices) {
    const body = world.createBody({ 
        type: 'static', 
        position: planck.Vec2(x, y), 
        angle: angle 
    });
    // Map array of arrays to planck.Vec2
    const planckVerts = vertices.map(v => planck.Vec2(v[0], v[1]));
    body.createFixture(planck.Polygon(planckVerts), { friction: 0.5, restitution: 0.0 });
    return body;
}

function createGroundCircle(world, x, y, radius) {
    const body = world.createBody({ type: 'static', position: planck.Vec2(x, y) });
    body.createFixture(planck.Circle(radius), { friction: 0.5, restitution: 0.0 });
    return body;
}

// --- THE MASTER MAP BUILDER ---
function loadMap(world, mapId) {
    console.log(`[MapLoader] Constructing collision geometry for Map ID: ${mapId}`);

    switch(mapId) {
        case 1: buildMapTutorial(world); break;
        case 2: buildMapStorage(world); break;
        case 3: buildMapRooftops(world); break;
        case 4: buildMapPoliceStation(world); break;
        case 5: buildMapHazardous(world); break;
        case 6: buildMapBackstreets(world); break;
        case 7: buildMapTestingFloor(world); break;
        case 8: buildMapDuelArena(world); break;
        case 10: buildMapSurvival01(world); break;
        case 11: buildMapSurvivalArena(world); break;
        default: 
            console.log(`Map ${mapId} missing or deprecated. Defaulting to Duel Arena.`);
            buildMapDuelArena(world); 
            break;
    }
}

// ==========================================
// MAP BLUEPRINTS (Extracted from AS3)
// ==========================================

function buildMapTutorial(world) {
    createGroundBox(world, -34/SCALE, 105/SCALE, 0, 110/SCALE, 358/SCALE);
    createGroundBox(world, 196/SCALE, -35/SCALE, 0, 452/SCALE, 104/SCALE);
    createGroundBox(world, 183.5/SCALE, 254/SCALE, 0, 469/SCALE, 92/SCALE);
    createGroundBox(world, 389/SCALE, 103/SCALE, 0, 122/SCALE, 381/SCALE);
}

function buildMapStorage(world) {
    createGroundBox(world, 176.5/SCALE, 26.5/SCALE, 0, 351/SCALE, 51/SCALE);
    createGroundBox(world, 431/SCALE, 41.5/SCALE, 0, 184/SCALE, 81/SCALE);
    createGroundBox(world, 345/SCALE, 94/SCALE, 0, 12/SCALE, 24/SCALE);
    createGroundBox(world, 495/SCALE, 99.5/SCALE, 0, 56/SCALE, 35/SCALE);
    createGroundBox(world, 411.5/SCALE, 147/SCALE, 0, 145/SCALE, 12/SCALE);
    createGroundBox(world, 503.5/SCALE, 153/SCALE, 0, 39/SCALE, 72/SCALE);
    createGroundBox(world, 495/SCALE, 259/SCALE, 0, 56/SCALE, 140/SCALE);
    createGroundBox(world, 475.5/SCALE, 159/SCALE, 0, 17/SCALE, 12/SCALE);
    createGroundBox(world, 27.5/SCALE, 190.5/SCALE, 0, 53/SCALE, 277/SCALE);
    createGroundBox(world, 104.5/SCALE, 120/SCALE, 0, 73/SCALE, 18/SCALE); // Metal
    createGroundBox(world, 90.5/SCALE, 292/SCALE, 0, 73/SCALE, 74/SCALE);
    createGroundBox(world, 230.5/SCALE, 301/SCALE, 0, 147/SCALE, 56/SCALE);
    createGroundPolygon(world, 143/SCALE, 294/SCALE, 0, [[-16/SCALE,-39/SCALE], [-10/SCALE,-39/SCALE], [14/SCALE,-21/SCALE], [14/SCALE,35/SCALE], [-16/SCALE,35/SCALE]]);
    createGroundBox(world, 400.5/SCALE, 292/SCALE, 0, 133/SCALE, 74/SCALE);
    createGroundPolygon(world, 320/SCALE, 292/SCALE, 0, [[-16/SCALE,-19/SCALE], [8/SCALE,-37/SCALE], [14/SCALE,-37/SCALE], [14/SCALE,37/SCALE], [-16/SCALE,37/SCALE]]);
    createGroundBox(world, 246/SCALE, 145/SCALE, 0, 102/SCALE, 2/SCALE);
    createGroundBox(world, 197/SCALE, 167/SCALE, 0, 50/SCALE, 2/SCALE);
    createGroundBox(world, 105/SCALE, 184/SCALE, 0, 102/SCALE, 2/SCALE);
    createGroundBox(world, 221.5/SCALE, 208/SCALE, 0, 93/SCALE, 2/SCALE);
    createGroundBox(world, 221.5/SCALE, 230/SCALE, 0, 93/SCALE, 2/SCALE);
    createGroundBox(world, 221.5/SCALE, 252/SCALE, 0, 93/SCALE, 2/SCALE);
    createGroundBox(world, 392.5/SCALE, 212/SCALE, 0, 93/SCALE, 2/SCALE);
    createGroundBox(world, 392.5/SCALE, 234/SCALE, 0, 93/SCALE, 2/SCALE);
    createGroundBox(world, 423/SCALE, 190/SCALE, 0, 88/SCALE, 2/SCALE);
    createGroundBox(world, 167/SCALE, 196/SCALE, 0.785398, 34/SCALE, 3/SCALE);
    createGroundCircle(world, 125/SCALE, 301/SCALE, 7/SCALE);
}

function buildMapRooftops(world) {
    createGroundBox(world, 103.5/SCALE, 157/SCALE, 0, 167/SCALE, 124/SCALE);
    createGroundBox(world, 39/SCALE, 74/SCALE, 0, 38/SCALE, 42/SCALE);
    createGroundBox(world, 68/SCALE, 63/SCALE, 0, 20/SCALE, 20/SCALE);
    createGroundBox(world, 43.5/SCALE, 237/SCALE, 0, 47/SCALE, 36/SCALE);
    createGroundBox(world, 33.5/SCALE, 267/SCALE, 0, 27/SCALE, 24/SCALE);
    createGroundBox(world, 103.5/SCALE, 319/SCALE, 0, 167/SCALE, 82/SCALE);
    createGroundBox(world, 265.5/SCALE, 323/SCALE, 0, 47/SCALE, 78/SCALE);
    createGroundBox(world, 429.5/SCALE, 332/SCALE, 0, 223/SCALE, 60/SCALE);
    createGroundPolygon(world, 304/SCALE, 311/SCALE, 0, [[-15/SCALE,-27/SCALE], [-10/SCALE,-27/SCALE], [14/SCALE,-9/SCALE], [14/SCALE,51/SCALE], [-15/SCALE,51/SCALE]]);
    createGroundBox(world, 180.5/SCALE, 231/SCALE, 0, 13/SCALE, 24/SCALE);
    createGroundBox(world, 274.5/SCALE, 200.5/SCALE, 0, 65/SCALE, 13/SCALE);
    createGroundBox(world, 248.5/SCALE, 228/SCALE, 0, 13/SCALE, 42/SCALE);
    createGroundBox(world, 380/SCALE, 200.5/SCALE, 0, 24/SCALE, 13/SCALE);
    createGroundBox(world, 468/SCALE, 200.5/SCALE, 0, 30/SCALE, 13/SCALE);
    createGroundBox(world, 493/SCALE, 162/SCALE, 0, 20/SCALE, 20/SCALE);
    createGroundBox(world, 522/SCALE, 173/SCALE, 0, 38/SCALE, 42/SCALE);
    createGroundBox(world, 512/SCALE, 236.5/SCALE, 0, 58/SCALE, 85/SCALE);
    createGroundBox(world, 522/SCALE, 290.5/SCALE, 0, 38/SCALE, 23/SCALE);
    createGroundBox(world, 200.5/SCALE, 221/SCALE, 0, 27/SCALE, 4/SCALE); // Cloud
    createGroundBox(world, 265.5/SCALE, 84/SCALE, 0, 119/SCALE, 4/SCALE); // Cloud
    createGroundBox(world, 337.5/SCALE, 197/SCALE, 0, 13/SCALE, 6/SCALE);
    createGroundBox(world, 422.5/SCALE, 197/SCALE, 0, 13/SCALE, 6/SCALE);
    createGroundBox(world, 155/SCALE, 380/SCALE, 0, 64/SCALE, 40/SCALE);
    createGroundBox(world, 269/SCALE, 381/SCALE, 0, 54/SCALE, 38/SCALE);
}

function buildMapPoliceStation(world) {
    createGroundBox(world, 302.5/SCALE, 413/SCALE, 0, 369/SCALE, 70/SCALE);
    createGroundBox(world, 590/SCALE, 407/SCALE, 0, 230/SCALE, 82/SCALE);
    createGroundPolygon(world, 719/SCALE, 409/SCALE, 0, [[-14/SCALE,-43/SCALE], [-10/SCALE,-43/SCALE], [14/SCALE,-25/SCALE], [14/SCALE,39/SCALE], [-14/SCALE,39/SCALE]]);
    createGroundBox(world, 818.5/SCALE, 416/SCALE, 0, 171/SCALE, 64/SCALE);
    createGroundBox(world, 886/SCALE, 372/SCALE, 0, 36/SCALE, 24/SCALE);
    createGroundBox(world, 876/SCALE, 309/SCALE, 0, 56/SCALE, 102/SCALE);
    createGroundBox(world, 876/SCALE, 117.5/SCALE, 0, 56/SCALE, 233/SCALE);
    createGroundBox(world, 886/SCALE, 246/SCALE, 0, 36/SCALE, 24/SCALE);
    createGroundBox(world, 822/SCALE, 163/SCALE, 0, 52/SCALE, 34/SCALE);
    createGroundBox(world, 777/SCALE, 174/SCALE, 0, 38/SCALE, 12/SCALE);
    createGroundBox(world, 637.5/SCALE, 174/SCALE, 0, 171/SCALE, 12/SCALE);
    createGroundBox(world, 716.5/SCALE, 200/SCALE, 0, 13/SCALE, 40/SCALE);
    createGroundBox(world, 558.5/SCALE, 201/SCALE, 0, 13/SCALE, 42/SCALE);
    createGroundBox(world, 733/SCALE, 192/SCALE, 0, 20/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 749.5/SCALE, 215/SCALE, 0, 45/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 749.5/SCALE, 237/SCALE, 0, 45/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 629/SCALE, 276/SCALE, 0, 154/SCALE, 36/SCALE);
    createGroundBox(world, 777/SCALE, 282/SCALE, 0, 142/SCALE, 48/SCALE);
    createGroundBox(world, 558.5/SCALE, 312/SCALE, 0, 13/SCALE, 36/SCALE);
    createGroundBox(world, 712.5/SCALE, 321/SCALE, 0, 13/SCALE, 30/SCALE);
    createGroundBox(world, 125/SCALE, 341.5/SCALE, 0, 14/SCALE, 73/SCALE);
    createGroundBox(world, 248/SCALE, 273/SCALE, 0, 38/SCALE, 4/SCALE); // Cloud
    createGroundBox(world, 299/SCALE, 273/SCALE, 0, 38/SCALE, 4/SCALE); // Cloud
    createGroundCircle(world, 125/SCALE, 301/SCALE, 7/SCALE);
    createGroundBox(world, 663/SCALE, 302.5/SCALE, 0, 8/SCALE, 17/SCALE);
    createGroundBox(world, 662.5/SCALE, 359.5/SCALE, 0, 15/SCALE, 13/SCALE);
    createGroundBox(world, 877/SCALE, -43.5/SCALE, 0, 58/SCALE, 89/SCALE);
    createGroundBox(world, 238/SCALE, 317/SCALE, 0, 58/SCALE, 4/SCALE);
}

function buildMapHazardous(world) {
    createGroundBox(world, 389.5/SCALE, 305/SCALE, 0, 73/SCALE, 18/SCALE); // Metal
    createGroundBox(world, 566/SCALE, 307/SCALE, 0, 106/SCALE, 14/SCALE);
    createGroundBox(world, 492/SCALE, 180/SCALE, 0, 150/SCALE, 12/SCALE);
    createGroundBox(world, 592/SCALE, 225/SCALE, 0, 50/SCALE, 102/SCALE);
    createGroundBox(world, 603/SCALE, 288/SCALE, 0, 28/SCALE, 24/SCALE);
    createGroundBox(world, 602/SCALE, 162/SCALE, 0, 30/SCALE, 24/SCALE);
    createGroundBox(world, 592/SCALE, 123.5/SCALE, 0, 50/SCALE, 53/SCALE);
    createGroundBox(world, 517/SCALE, 49/SCALE, 0, 200/SCALE, 96/SCALE);
    createGroundBox(world, 423.5/SCALE, 117.5/SCALE, 0, 13/SCALE, 41/SCALE);
    createGroundBox(world, 296/SCALE, 17.5/SCALE, 0, 242/SCALE, 33/SCALE);
    createGroundBox(world, 168.5/SCALE, 76.5/SCALE, 0, 13/SCALE, 35/SCALE);
    createGroundBox(world, 88/SCALE, 30/SCALE, 0, 174/SCALE, 58/SCALE);
    createGroundBox(world, 18/SCALE, 82.5/SCALE, 0, 34/SCALE, 47/SCALE);
    createGroundBox(world, 8/SCALE, 118/SCALE, 0, 14/SCALE, 24/SCALE);
    createGroundBox(world, 88/SCALE, 136/SCALE, 0, 174/SCALE, 12/SCALE);
    createGroundBox(world, 18/SCALE, 184/SCALE, 0, 34/SCALE, 84/SCALE);
    createGroundBox(world, 8/SCALE, 238/SCALE, 0, 14/SCALE, 24/SCALE);
    createGroundBox(world, 22/SCALE, 282/SCALE, 0, 42/SCALE, 64/SCALE);
    createGroundBox(world, 126/SCALE, 300/SCALE, 0, 58/SCALE, 28/SCALE);
    createGroundPolygon(world, 66/SCALE, 289/SCALE, 0, [[-23/SCALE,-39/SCALE], [-18/SCALE,-39/SCALE], [31/SCALE,-3/SCALE], [31/SCALE,24/SCALE], [-23/SCALE,24/SCALE]]);
    createGroundBox(world, 92.5/SCALE, 235.5/SCALE, -0.785398, 34/SCALE, 4/SCALE); // Cloud
    createGroundBox(world, 137.5/SCALE, 224/SCALE, 0, 69/SCALE, 4/SCALE); // Cloud
    createGroundBox(world, 258/SCALE, 132/SCALE, 0, 66/SCALE, 4/SCALE); // Cloud
    createGroundBox(world, 320/SCALE, 202/SCALE, 0, 70/SCALE, 4/SCALE); // Cloud
}

function buildMapBackstreets(world) {
    createGroundBox(world, 517.5/SCALE, 41/SCALE, 0, 171/SCALE, 12/SCALE);
    createGroundBox(world, 117/SCALE, 31/SCALE, 0, 182/SCALE, 12/SCALE);
    createGroundBox(world, 30/SCALE, 67/SCALE, 0, 46/SCALE, 60/SCALE);
    createGroundBox(world, 20.5/SCALE, 109/SCALE, 0, 27/SCALE, 24/SCALE);
    createGroundBox(world, 30/SCALE, 165/SCALE, 0, 46/SCALE, 88/SCALE);
    createGroundBox(world, 130.5/SCALE, 127/SCALE, 0, 155/SCALE, 12/SCALE);
    createGroundBox(world, 201.5/SCALE, 144/SCALE, 0, 13/SCALE, 22/SCALE);
    createGroundBox(world, 63/SCALE, 159/SCALE, 0, 20/SCALE, 52/SCALE);
    createGroundBox(world, 53/SCALE, 225/SCALE, 0, 92/SCALE, 32/SCALE);
    createGroundBox(world, 168/SCALE, 216/SCALE, 0, 80/SCALE, 50/SCALE);
    createGroundBox(world, 268/SCALE, 226/SCALE, 0, 40/SCALE, 30/SCALE);
    createGroundBox(world, 374/SCALE, 216/SCALE, 0, 90/SCALE, 50/SCALE);
    createGroundBox(world, 502.5/SCALE, 210/SCALE, 0, 167/SCALE, 62/SCALE);
    createGroundBox(world, 572/SCALE, 113/SCALE, 0, 28/SCALE, 132/SCALE);
    createGroundBox(world, 539.5/SCALE, 115.5/SCALE, 0, 37/SCALE, 17/SCALE); // Metal
    createGroundBox(world, 334.5/SCALE, 148/SCALE, 0, 13/SCALE, 20/SCALE);
    createGroundBox(world, 334.5/SCALE, 88/SCALE, 0, 13/SCALE, 22/SCALE);
    createGroundBox(world, 386.5/SCALE, 83/SCALE, 0, 91/SCALE, 12/SCALE);
    createGroundBox(world, 438.5/SCALE, 68/SCALE, 0, 13/SCALE, 42/SCALE);
    createGroundBox(world, 357.5/SCALE, 139/SCALE, 0, 33/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 425.5/SCALE, 139/SCALE, 0, 77/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 201.5/SCALE, 61/SCALE, 0, 13/SCALE, 48/SCALE);
    createGroundPolygon(world, 115/SCALE, 223/SCALE, 0, [[-16/SCALE,-14/SCALE], [8/SCALE,-32/SCALE], [13/SCALE,-32/SCALE], [13/SCALE,18/SCALE], [-16/SCALE,18/SCALE]]);
    createGroundPolygon(world, 228/SCALE, 224/SCALE, 0, [[-20/SCALE,-33/SCALE], [20/SCALE,-13/SCALE], [20/SCALE,17/SCALE], [-20/SCALE,17/SCALE]]);
    createGroundPolygon(world, 310/SCALE, 223/SCALE, 0, [[-22/SCALE,-12/SCALE], [19/SCALE,-32/SCALE], [19/SCALE,18/SCALE], [-22/SCALE,18/SCALE]]);
    createGroundBox(world, 16/SCALE, 31/SCALE, 0, 20/SCALE, 12/SCALE);
}

function buildMapTestingFloor(world) {
    createGroundBox(world, 90/SCALE, 42.5/SCALE, 0, 178/SCALE, 83/SCALE);
    createGroundBox(world, 320.5/SCALE, 42/SCALE, 0, 149/SCALE, 82/SCALE);
    createGroundBox(world, 592/SCALE, 42/SCALE, 0, 260/SCALE, 82/SCALE);
    createGroundBox(world, 212/SCALE, -14/SCALE, 0, 139/SCALE, 38/SCALE);
    createGroundBox(world, 428/SCALE, -13/SCALE, 0, 123/SCALE, 35/SCALE);
    createGroundBox(world, 663/SCALE, 137/SCALE, 0, 118/SCALE, 108/SCALE);
    createGroundBox(world, 683/SCALE, 221/SCALE, 0, 78/SCALE, 60/SCALE);
    createGroundBox(world, 587.5/SCALE, 263/SCALE, 0, 269/SCALE, 24/SCALE);
    createGroundBox(world, 0.5/SCALE, 137.5/SCALE, 0, 71/SCALE, 107/SCALE);
    createGroundBox(world, 72.5/SCALE, 263/SCALE, 0, 232/SCALE, 24/SCALE);
    createGroundBox(world, -24/SCALE, 221/SCALE, 0, 39/SCALE, 60/SCALE);
    createGroundBox(world, 320/SCALE, 243.5/SCALE, 0, 150/SCALE, 63/SCALE);
    createGroundPolygon(world, 217/SCALE, 254/SCALE, 0, [[-29/SCALE,-3/SCALE], [23/SCALE,-42/SCALE], [28/SCALE,-42/SCALE], [28/SCALE,21/SCALE], [-29/SCALE,21/SCALE]]);
    createGroundPolygon(world, 422/SCALE, 252/SCALE, 0, [[-22/SCALE,-40/SCALE], [31/SCALE,-1/SCALE], [31/SCALE,23/SCALE], [-27/SCALE,23/SCALE], [-27/SCALE,-40/SCALE]]);
    createGroundBox(world, 320.5/SCALE, 169/SCALE, 0, 93/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 320.5/SCALE, 191/SCALE, 0, 93/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 212.5/SCALE, 75.5/SCALE, 0, 67/SCALE, 13/SCALE); // Hatch
    createGroundBox(world, 428.5/SCALE, 75.5/SCALE, 0, 67/SCALE, 13/SCALE); // Hatch
    createGroundBox(world, 624/SCALE, 221/SCALE, 0, 40/SCALE, 60/SCALE);
    createGroundBox(world, 15.5/SCALE, 221/SCALE, 0, 41/SCALE, 60/SCALE);
    createGroundBox(world, 170/SCALE, 146/SCALE, 0, 52/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 94.5/SCALE, 186/SCALE, 0, 117/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 94.5/SCALE, 208/SCALE, 0, 45/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 94.5/SCALE, 230/SCALE, 0, 45/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 543.5/SCALE, 230/SCALE, 0, 45/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 543.5/SCALE, 208/SCALE, 0, 45/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 545.5/SCALE, 186/SCALE, 0, 117/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 468/SCALE, 146/SCALE, 0, 52/SCALE, 2/SCALE); // Cloud
    createGroundBox(world, 339/SCALE, 300/SCALE, 0, 766/SCALE, 50/SCALE);
}

function buildMapSurvival01(world) {
    // Survival01 is identical to TestingFloor, plus one extra constraint box at the bottom
    buildMapTestingFloor(world);
    createGroundBox(world, 320/SCALE, 361.5/SCALE, 0, 570/SCALE, 43/SCALE);
    createGroundBox(world, 319.5/SCALE, 307.5/SCALE, 0, 9/SCALE, 65/SCALE);
}

function buildMapDuelArena(world) {
    createGroundBox(world, 300/SCALE, 350/SCALE, 0, 600/SCALE, 50/SCALE);
    createGroundBox(world, 300/SCALE, 50/SCALE, 0, 600/SCALE, 50/SCALE);
    createGroundBox(world, 25/SCALE, 200/SCALE, 0, 50/SCALE, 400/SCALE);
    createGroundBox(world, 575/SCALE, 200/SCALE, 0, 50/SCALE, 400/SCALE);
    createGroundPolygon(world, 106/SCALE, 295/SCALE, 0, [[44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    createGroundPolygon(world, 194/SCALE, 295/SCALE, 0, [[-44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    createGroundPolygon(world, 406/SCALE, 295/SCALE, 0, [[44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    createGroundPolygon(world, 494/SCALE, 295/SCALE, 0, [[-44/SCALE,-30/SCALE], [44/SCALE,30/SCALE], [-44/SCALE,30/SCALE]]);
    // Platforms (Clouds)
    createGroundBox(world, 300/SCALE, 288/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 270/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 252/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 234/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 216/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 198/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 180/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 162/SCALE, 0, 60/SCALE, 4/SCALE);
    createGroundBox(world, 300/SCALE, 142/SCALE, 0, 312/SCALE, 4/SCALE);
}

function buildMapSurvivalArena(world) {
    // SurvivalArena uses the exact same geometry layout as DuelArena
    buildMapDuelArena(world);
}

module.exports = { loadMap };