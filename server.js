const WebSocket = require('ws');
const planck = require('planck-js');
const MapLoader = require('./MapLoader');

const PORT = process.env.PORT || 8888; 
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Authoritative Matchmaking Hub live on port ${PORT}...`);
});

// Physics constraints
const FPS = 24;
const TICK_RATE = 1000 / FPS;

const gameRooms = {}; 

function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 7).toUpperCase();
    } while (gameRooms[code]);
    return code;
}

function purgeOldState(ws) {
    for (let code in gameRooms) {
        const room = gameRooms[code];
        
        if (room.host === ws) {
            console.log(`-> Host moved on. Vaporizing Room [${code}].`);
            room.clients.forEach(c => { 
                if (c !== ws && c.readyState === WebSocket.OPEN) c.send("ERROR:HOST_LEFT"); 
            });
            delete gameRooms[code]; 
        } else {
            const index = room.clients.indexOf(ws);
            if (index !== -1) {
                room.clients.splice(index, 1);
            }
        }
    }
    ws.roomCode = null;
    ws.isHost = false;
}

wss.on('connection', (ws) => {
    if (ws._socket) {
        ws._socket.setNoDelay(true);
    }

    ws.roomCode = null;
    ws.isHost = false;

    ws.on('message', (message) => {
        const line = message.toString().replace(/\r/g, ''); 
        if (line.length === 0) return;

        if (line === "KEEPALIVE_PING") {
            ws.send("KEEPALIVE_PONG");
            return;
        }

        // ==========================================
        // MATCHMAKING & LOBBY LOGIC
        // ==========================================

        if (line.startsWith("GET_LOBBIES:")) {
            purgeOldState(ws); 
            
            let lobbyStrings = [];
            for (let code in gameRooms) {
                let room = gameRooms[code];
                if (room.isPublic) {
                    lobbyStrings.push(`${room.name}|${code}|${room.bots}|${room.mode}|${room.ping}`);
                }
            }
            ws.send("LOBBY_LIST:" + lobbyStrings.join(","));
            return;
        }

        if (line === "ROLE:HOST") {
            purgeOldState(ws);
            
            const roomCode = generateRoomCode();
            ws.roomCode = roomCode;
            ws.isHost = true;
            
            gameRooms[roomCode] = { 
                host: ws, 
                clients: [ws], 
                isPublic: false,
                world: MapLoader.createPhysicsWorld(),
                players: {},
                objects: {}
            };
            
            ws.send(`ROOM_CODE:${roomCode}`);
            console.log(`-> HOST created Room [${roomCode}].`);
            return;
        }

        if (line.startsWith("CREATE_PUBLIC:")) {
            purgeOldState(ws);
            
            const parts = line.substring(14).split("|");
            const roomName = parts[0] || "Public Match";
            const bots = parseInt(parts[1]) || 0;
            const mode = parts[2] || "VS Mode";

            const roomCode = generateRoomCode();
            ws.roomCode = roomCode;
            ws.isHost = true;

            gameRooms[roomCode] = {
                host: ws, 
                clients: [ws], 
                isPublic: true, 
                name: roomName, 
                bots: bots, 
                mode: mode,
                ping: Math.floor(Math.random() * 40) + 20,
                world: MapLoader.createPhysicsWorld(),
                players: {},
                objects: {}
            };
            
            ws.send(`ROOM_CODE:${roomCode}`);
            console.log(`-> HOST created PUBLIC Room [${roomCode}].`);
            return;
        }
        
        if (line.indexOf("ROLE:CLIENT:") === 0) {
            purgeOldState(ws); 
            
            const targetCode = line.split(":")[2].toUpperCase();

            if (!gameRooms[targetCode]) {
                ws.send("ERROR:ROOM_NOT_FOUND");
                return;
            }

            const room = gameRooms[targetCode];

            if (room.clients.length >= 2) {
                ws.send("ERROR:ROOM_FULL");
                return;
            }

            ws.roomCode = targetCode;
            ws.isHost = false;
            room.clients.push(ws);
            
            console.log(`-> JOINER successfully entered Room [${targetCode}].`);
            
            ws.send("AUTH_OK"); 
            
            setTimeout(() => {
                if (room.host.readyState === WebSocket.OPEN) {
                    room.host.send("J"); 
                }
            }, 500);
            
            return;
        }

        // ==========================================
        // AUTHORITATIVE PHYSICS LOGIC
        // ==========================================
        
        if (ws.roomCode && gameRooms[ws.roomCode]) {
            const room = gameRooms[ws.roomCode];

            // 1. MAP LOADING TRIGGER
            if (line.startsWith("LOAD_MAP:") && ws.isHost) {
                const mapId = parseInt(line.split(":")[1]); 
                MapLoader.loadMap(room, mapId); // Only load static map boundaries
                return;
            }

            // ==========================================
            // MAP INITIALIZATION FROM HOST
            // ==========================================
            if (line.startsWith("INIT_PLAYER:") && ws.isHost) {
                const parts = line.split(":");
                const pId = parts[1]; // "P1" or "P2"
                const px = parseFloat(parts[2]) / 30; // Scale pixels down to Box2D meters
                const py = parseFloat(parts[3]) / 30;

                const playerBodyDef = {
                    fixedRotation: true,
                    bullet: true
                };

                // Destroy old body if it exists from a previous round
                if (room.players[pId]) {
                    room.world.destroyBody(room.players[pId]);
                }

                room.players[pId] = room.world.createDynamicBody({
                    ...playerBodyDef,
                    position: planck.Vec2(px, py)
                });

                room.players[pId].createFixture(
                    planck.Box(10 / 30, 20 / 30),
                    {
                        density: 1.0,
                        friction: 0.0, // Prevents wall-sticking
                        filter: {
                            categoryBits: MapLoader.COLLISION.PLAYER,
                            maskBits: MapLoader.COLLISION.SOLID | MapLoader.COLLISION.DYNAMIC | MapLoader.COLLISION.LADDER
                        }
                    }
                );
                return;
            }

            if (line.startsWith("INIT_OBJ:") && ws.isHost) {
                const parts = line.split(":");
                const objId = parts[1];
                const ox = parseFloat(parts[2]) / 30;
                const oy = parseFloat(parts[3]) / 30;
                const orot = parseFloat(parts[4]) * (Math.PI / 180);
                const ow = parseFloat(parts[5]) / 30;
                const oh = parseFloat(parts[6]) / 30;

                // Create the Planck.js crate based on the Flash client's exact coordinates and dimensions
                MapLoader.createDynamicObject(room, objId, ox, oy, ow, oh, { material: 'wood', density: 1.0 });
                
                if (room.objects[objId]) {
                    room.objects[objId].setAngle(orot);
                }
                return;
            }

            // Legacy Start Trigger (Pass-through for UI to drop the barrier)
            if (line.startsWith("S:") && ws.isHost) {
                room.clients.forEach(c => {
                    if (c.readyState === WebSocket.OPEN) c.send(line);
                });
                return;
            }

            // 2. RAW KEYBOARD INPUTS TO PHYSICS
            if (line.startsWith("D:") || line.startsWith("U:")) {
                const parts = line.split(":");
                const state = parts[0]; 
                const netKey = parseInt(parts[1]);
                
                const playerId = (netKey >= 200 && netKey < 300) ? "P1" : "P2";
                const keyIdx = netKey % 100; // 0=Up/Jump, 1=Down, 2=Left, 3=Right
                
                // Echo the keystroke to clients for animation sync
                room.clients.forEach(c => {
                    if (c !== ws && c.readyState === WebSocket.OPEN) c.send(line);
                });

                if (room.players[playerId]) {
                    const playerBody = room.players[playerId];
                    const currentVel = playerBody.getLinearVelocity();

                    if (state === "D") {
                        if (keyIdx === 0) { 
                            playerBody.setLinearVelocity(planck.Vec2(currentVel.x, -10)); 
                        } else if (keyIdx === 2) { 
                            playerBody.setLinearVelocity(planck.Vec2(-7, currentVel.y));
                        } else if (keyIdx === 3) { 
                            playerBody.setLinearVelocity(planck.Vec2(7, currentVel.y));
                        }
                    } 
                    else if (state === "U") {
                        if (keyIdx === 2 || keyIdx === 3) { 
                             playerBody.setLinearVelocity(planck.Vec2(0, currentVel.y));
                        }
                    }
                }
                return;
            }

            // 3. DESTRUCTION EVENT (Crates & Barrels blowing up)
            if (line.startsWith("INTENT:DESTROY:")) {
                const objectId = line.split(":")[2];
                
                if (room.objects[objectId]) {
                    // Remove from server physics engine
                    room.world.destroyBody(room.objects[objectId]);
                    delete room.objects[objectId];
                }
                
                // Broadcast to clients to delete it visually
                room.clients.forEach(c => {
                    if (c.readyState === WebSocket.OPEN) c.send(`DELETE:${objectId}`);
                });
                return;
            }

            // 4. UI/MENU SYNC PASS-THROUGH
            if (line.startsWith("SYNC_MENU")) {
                room.clients.forEach(c => {
                    if (c !== ws && c.readyState === WebSocket.OPEN) {
                        c.send(line);
                    }
                });
            }
        }
    });

    ws.on('close', () => {
        purgeOldState(ws); 
    });
});

// ====================================================
// THE MASTER PHYSICS LOOP (THE HEARTBEAT)
// ====================================================
setInterval(() => {
    for (let code in gameRooms) {
        const room = gameRooms[code];
        
        if (room.world) {
            MapLoader.stepPhysics(room);
        }
        
        // 1. Transmit Player Coordinates
        if (room.players["P1"] && room.players["P2"]) {
            const p1Pos = room.players["P1"].getPosition();
            const p2Pos = room.players["P2"].getPosition();
            
            const p1Packet = `POS:P1:${(p1Pos.x * 30).toFixed(1)}:${(p1Pos.y * 30).toFixed(1)}\n`;
            const p2Packet = `POS:P2:${(p2Pos.x * 30).toFixed(1)}:${(p2Pos.y * 30).toFixed(1)}\n`;
            
            room.clients.forEach(c => {
                if (c.readyState === 1) { c.send(p1Packet); c.send(p2Packet); }
            });
        }

        // 2. Transmit Dynamic Object Coordinates
        for (let objId in room.objects) {
            const objBody = room.objects[objId];
            const pos = objBody.getPosition();
            const angle = objBody.getAngle() * (180 / Math.PI); 
            
            const objPacket = `POS:OBJ:${objId}:${(pos.x * 30).toFixed(1)}:${(pos.y * 30).toFixed(1)}:${angle.toFixed(1)}\n`;
            
            room.clients.forEach(c => {
                if (c.readyState === 1) c.send(objPacket);
            });
        }
    }
}, TICK_RATE);
