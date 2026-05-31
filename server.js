const WebSocket = require('ws');

// Read the dynamic port assigned by Render, defaulting to 8888 for local testing
const PORT = process.env.PORT || 8888; 

// Initialize the WebSocket Server on Render's required port binding
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Global Production Matchmaking Hub live on port ${PORT}...`);
});

// Storage for active game rooms
// Format: { "ROOM_CODE": { host: ws, clients: [ws1, ws2], privacy: "PUBLIC", name: "My Server" } }
const gameRooms = {}; 

// Helper to generate a random 5-letter Room Code
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

        // 1. GLOBAL ROLE AUTHENTICATION: HOST CREATION
        // Expects format: "ROLE:HOST:PRIVATE:Lobby Name" or "ROLE:HOST:PUBLIC:Lobby Name"
        if (line.startsWith("ROLE:HOST")) {
            const parts = line.split(":");
            const privacy = parts[2] || "PUBLIC"; // Defaults to PUBLIC if missing
            const lobbyName = parts.slice(3).join(":") || "Unnamed Server"; // Grabs the lobby name safely
            
            const roomCode = generateRoomCode();
            
            ws.roomCode = roomCode;
            ws.isHost = true;
            ws.privacy = privacy;
            ws.lobbyName = lobbyName;

            gameRooms[roomCode] = {
                host: ws,
                clients: [ws],
                privacy: privacy,
                name: lobbyName
            };

            if (privacy === "PRIVATE") {
                console.log(`-> PRIVATE LOBBY CREATED: [${lobbyName}] Code [${roomCode}]`);
            } else {
                console.log(`-> PUBLIC LOBBY CREATED: [${lobbyName}] Code [${roomCode}]`);
            }
            
            // Send the code back down to the bridge/host
            ws.send(`ROOM_CODE:${roomCode}`);
            return;
        }
        
        // 2. GLOBAL ROLE AUTHENTICATION: JOINER CONNECTION
        // Expects format: "ROLE:CLIENT:XXXXX"
        if (line.startsWith("ROLE:CLIENT:")) {
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
            
            // Alert the Host and authorize the Joiner
            room.host.send("J"); 
            ws.send("AUTH_OK"); 
            return;
        }

        // 3. ROOM-ISOLATED REALTIME BROADCAST
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
