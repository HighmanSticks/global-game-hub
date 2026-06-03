const WebSocket = require('ws');

// Read the dynamic port assigned by Render, defaulting to 8888 for local testing
const PORT = process.env.PORT || 8888; 

// Initialize the WebSocket Server
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Global Production Matchmaking Hub live on port ${PORT}...`);
});

// Storage for active game rooms
// Format: { "ROOM_CODE": { host: ws, clients: [ws1, ws2], isPublic: true, name: "Johan's Lobby", bots: 2, mode: "Survival" } }
const gameRooms = {}; 

function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 7).toUpperCase();
    } while (gameRooms[code]);
    return code;
}

wss.on('connection', (ws) => {
    console.log('A client established a WebSocket link...');
    ws.roomCode = null;
    ws.isHost = false;

    ws.on('message', (message) => {
        const line = message.toString().trim();
        if (line.length === 0) return;

        // ==========================================
        // 1. THE SERVER BROWSER: FETCH LOBBIES
        // ==========================================
        if (line.startsWith("GET_LOBBIES:")) {
            let lobbyStrings = [];
            
            // Loop through all active rooms and pull the public ones
            for (let code in gameRooms) {
                let room = gameRooms[code];
                if (room.isPublic) {
                    // Format: Name|IP/Code|Bots|Mode|Ping
                    lobbyStrings.push(`${room.name}|${code}|${room.bots}|${room.mode}|${room.ping}`);
                }
            }
            
            console.log(`-> Sending ${lobbyStrings.length} public lobbies to a Joiner.`);
            ws.send("LOBBY_LIST:" + lobbyStrings.join(","));
            return;
        }

        // ==========================================
        // 2. HOST CREATION (PRIVATE ROOM)
        // ==========================================
        if (line === "ROLE:HOST") {
            const roomCode = generateRoomCode();
            ws.roomCode = roomCode;
            ws.isHost = true;

            gameRooms[roomCode] = {
                host: ws,
                clients: [ws],
                isPublic: false // Hidden from Server Browser
            };

            console.log(`-> PRIVATE LOBBY CREATED: Code [${roomCode}]`);
            ws.send(`ROOM_CODE:${roomCode}`);
            return;
        }

        // ==========================================
        // 3. HOST CREATION (PUBLIC ROOM)
        // Format expected: CREATE_PUBLIC:LobbyName|Bots|Mode
        // ==========================================
        if (line.startsWith("CREATE_PUBLIC:")) {
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
                ping: Math.floor(Math.random() * 40) + 20 // Simulate a realistic ping 20-60ms
            };

            console.log(`-> PUBLIC LOBBY CREATED: [${roomCode}] - ${roomName}`);
            ws.send(`ROOM_CODE:${roomCode}`);
            return;
        }
        
        // ==========================================
        // 4. JOINER CONNECTION
        // ==========================================
        if (line.indexOf("ROLE:CLIENT:") === 0) {
            const targetCode = line.split(":")[2].toUpperCase();

            if (!gameRooms[targetCode]) {
                console.log(`-> Join attempt failed: Room [${targetCode}] does not exist.`);
                ws.send("ERROR:ROOM_NOT_FOUND");
                ws.close();
                return;
            }

            const room = gameRooms[targetCode];
            ws.roomCode = targetCode;
            ws.isHost = false;
            
            room.clients.push(ws);
            console.log(`-> JOINER entered Room [${targetCode}].`);
            
            room.host.send("J"); 
            ws.send("AUTH_OK"); 
            return;
        }

        // ==========================================
        // 5. IN-GAME REALTIME BROADCAST
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
        if (ws.roomCode && gameRooms[ws.roomCode]) {
            const room = gameRooms[ws.roomCode];
            
            if (ws.isHost) {
                console.log(`-> Host disconnected. Room [${ws.roomCode}] destroyed.`);
                room.clients.forEach(c => { if(c !== ws) c.close(); });
                delete gameRooms[ws.roomCode];
            } else {
                const index = room.clients.indexOf(ws);
                if (index !== -1) room.clients.splice(index, 1);
                console.log(`-> Joiner left Room [${ws.roomCode}].`);
            }
        }
    });

    ws.on('error', (err) => {
        console.error('Socket Error: ' + err.message);
    });
});
