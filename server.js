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

// THE FIX: Aggressive Cleanup Protocol
function purgeOldState(ws) {
    for (let code in gameRooms) {
        const room = gameRooms[code];
        
        // If they were a Host, destroy their ghost lobby
        if (room.host === ws) {
            console.log(`-> Host moved on. Vaporizing Ghost Room [${code}].`);
            room.clients.forEach(c => { if(c !== ws && c.readyState === WebSocket.OPEN) c.send("ERROR:HOST_LEFT"); });
            delete gameRooms[code];
        } else {
            // If they were a Joiner, remove them so they can rejoin later without "Invalid Code"
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
    ws.roomCode = null;
    ws.isHost = false;

    ws.on('message', (message) => {
        const line = message.toString().trim();
        if (line.length === 0) return;

        // Keep-Alive for the bridge
        if (line === "KEEPALIVE_PING") {
            ws.send("KEEPALIVE_PONG");
            return;
        }

        // ==========================================
        // 1. BROWSER: Purge old state before fetching
        // ==========================================
        if (line.startsWith("GET_LOBBIES:")) {
            purgeOldState(ws); // Kill ghost lobbies before broadcasting
            
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

        // ==========================================
        // 2. HOSTING: Purge old state before creating
        // ==========================================
        if (line === "ROLE:HOST") {
            purgeOldState(ws);
            
            const roomCode = generateRoomCode();
            ws.roomCode = roomCode;
            ws.isHost = true;
            gameRooms[roomCode] = { host: ws, clients: [ws], isPublic: false };
            ws.send(`ROOM_CODE:${roomCode}`);
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
            ws.send(`ROOM_CODE:${roomCode}`);
            return;
        }
        
        // ==========================================
        // 3. JOINING: Purge old state before connecting
        // ==========================================
        if (line.indexOf("ROLE:CLIENT:") === 0) {
            purgeOldState(ws); // Allows seamless re-joining!
            
            const targetCode = line.split(":")[2].toUpperCase();

            if (!gameRooms[targetCode]) {
                ws.send("ERROR:ROOM_NOT_FOUND");
                return;
            }

            const room = gameRooms[targetCode];
            ws.roomCode = targetCode;
            ws.isHost = false;
            room.clients.push(ws);
            
            console.log(`-> JOINER successfully entered Room [${targetCode}].`);
            room.host.send("J"); 
            ws.send("AUTH_OK"); 
            return;
        }

        // ==========================================
        // 4. IN-GAME PACKET BROADCAST
        // ==========================================
        if (ws.roomCode && gameRooms[ws.roomCode]) {
            const room = gameRooms[ws.roomCode];
            room.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(line);
                }
            });
        }
    });

    ws.on('close', () => {
        purgeOldState(ws); // Ensure everything burns down if the connection drops
    });
});
