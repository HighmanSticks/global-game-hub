const WebSocket = require('ws');
const planck = require('planck-js');
const MapLoader = require('./MapLoader'); // Pulls the blueprints from your MapLoader.js

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
    // Disable Nagle's Algorithm for instant 0ms input transmission
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
                world: planck.World(planck.Vec2(0, 10)), 
                players: {},
                objects: {} // <--- ADDED: Tracks destructible map objects
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
                world: planck.World(planck.Vec2(0, 10)),
                players: {},
                objects: {} // <--- ADDED: Tracks destructible map objects
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
                MapLoader.loadMap(room.world, mapId);
                
                room.players["P1"] = room.world.createDynamicBody(planck.Vec2(150/30, 50/30));
                room.players["P2"] = room.world.createDynamicBody(planck.Vec2(450/30, 50/30));
                
                room.players["P1"].createFixture(planck.Box(10/30, 20/30), { density: 1.0, friction: 0.3 });
                room.players["P2"].createFixture(planck.Box(10/30, 20/30), { density: 1.0, friction: 0.3 });
                return;
            }

            // Legacy Start Trigger (Still needed to kick off the clients)
            if (line.startsWith("S:") && ws.isHost) {
                room.clients.forEach(c => {
                    if (c.readyState === WebSocket.OPEN) c.send(line);
                });
                return;
            }

            // 2. RAW KEYBOARD INPUTS TO PHYSICS (D: and U:)
            if (line.startsWith("D:") || line.startsWith("U:")) {
                const parts = line.split(":");
                const state = parts[0]; // "D" for Down, "U" for Up
                const netKey = parseInt(parts[1]);
                
                const playerId = (netKey >= 200 && netKey < 300) ? "P1" : "P2";
                const keyIdx = netKey % 100; // 0=Up/Jump, 1=Down, 2=Left, 3=Right
                
                // Echo the keystroke to clients so the visual animations still play
                room.clients.forEach(c => {
                    if (c !== ws && c.readyState === WebSocket.OPEN) c.send(line);
                });

                // Apply Planck.js Physics based on the key
                if (room.players[playerId]) {
                    const playerBody = room.players[playerId];
                    const currentVel = playerBody.getLinearVelocity();

                    if (state === "D") {
                        if (keyIdx === 0) { // Up / Jump
                            playerBody.setLinearVelocity(planck.Vec2(currentVel.x, -10)); 
                        } else if (keyIdx === 2) { // Left
                            playerBody.setLinearVelocity(planck.Vec2(-7, currentVel.y));
                        } else if (keyIdx === 3) { // Right
                            playerBody.setLinearVelocity(planck.Vec2(7, currentVel.y));
                        }
                    } 
                    else if (state === "U") {
                        if (keyIdx === 2 || keyIdx === 3) { // Stop horizontal on release
                             playerBody.setLinearVelocity(planck.Vec2(0, currentVel.y));
                        }
                    }
                }
                return;
            }

            // 3. DESTRUCTION FIX (Crates blowing up)
            if (line.startsWith("INTENT:DESTROY:")) {
                const objectId = line.split(":")[2];
                // Broadcast to everyone to delete this object instantly so it doesn't get stuck
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
        
        // 1. Move physics time forward by 1 frame
        if (room.world) {
            room.world.step(1 / FPS);
        }
        
        // 2. Transmit coordinates back to Flash clients
        if (room.players["P1"] && room.players["P2"]) {
            const p1Pos = room.players["P1"].getPosition();
            const p2Pos = room.players["P2"].getPosition();
            
            // Multiply by 30 to convert from Box2D meters back to Flash pixels
            const p1Packet = `POS:P1:${(p1Pos.x * 30).toFixed(1)}:${(p1Pos.y * 30).toFixed(1)}`;
            const p2Packet = `POS:P2:${(p2Pos.x * 30).toFixed(1)}:${(p2Pos.y * 30).toFixed(1)}`;
            
            room.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(p1Packet);
                    client.send(p2Packet);
                }
            });
        }
    }
}, TICK_RATE);
