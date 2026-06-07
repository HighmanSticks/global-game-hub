const WebSocket = require('ws');

const PORT = process.env.PORT || 8888; 
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Global Production Matchmaking Hub live on port ${PORT}...`);
});

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
            console.log(`-> Host moved on. Vaporizing Ghost Room [${code}].`);
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
        // Strip Windows carriage returns but DO NOT trim() trailing spaces
        // Superfighters uses spaces in some packets (like player names)
        const line = message.toString().replace(/\r/g, ''); 
        if (line.length === 0) return;

        if (line === "KEEPALIVE_PING") {
            ws.send("KEEPALIVE_PONG");
            return;
        }

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
            gameRooms[roomCode] = { host: ws, clients: [ws], isPublic: false };
            
            // FIX: DO NOT DELAY THIS. The Host needs the code instantly.
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
                host: ws, clients: [ws], isPublic: true, name: roomName, bots: bots, mode: mode,
                ping: Math.floor(Math.random() * 40) + 20 
            };
            
            // FIX: DO NOT DELAY THIS.
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

            // STRICT LOCK: Prevent 3rd players from joining and causing a desync
            if (room.clients.length >= 2) {
                ws.send("ERROR:ROOM_FULL");
                return;
            }

            ws.roomCode = targetCode;
            ws.isHost = false;
            room.clients.push(ws);
            
            console.log(`-> JOINER successfully entered Room [${targetCode}].`);
            
            // 1. Tell the Joiner they are in so their screen starts loading instantly
            ws.send("AUTH_OK"); 
            
            // 2. THE LATENCY FIX: Wait 500ms before telling the Host to start the match
            setTimeout(() => {
                if (room.host.readyState === WebSocket.OPEN) {
                    room.host.send("J"); 
                }
            }, 500);
            
            return;
        }

        // ==========================================
        // IN-GAME PACKET BROADCAST (THE LOCKSTEP ECHO)
        // ==========================================
        if (ws.roomCode && gameRooms[ws.roomCode]) {
            const room = gameRooms[ws.roomCode];
            room.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    
                    // Keystrokes (D: or U:) bounce back to EVERYONE including the sender
                    if (line.startsWith("D:") || line.startsWith("U:")) {
                        client.send(line);
                    }
                    // UI and Menu Syncs do NOT send back to the sender
                    else if (client !== ws) {
                        client.send(line);
                    }
                }
            });
        }
    });

    ws.on('close', () => {
        purgeOldState(ws); 
    });
});
