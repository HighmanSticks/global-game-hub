const WebSocket = require('ws');

// Read the dynamic port assigned by Render, defaulting to 8888 for local testing
const PORT = process.env.PORT || 8888; 

// Initialize the WebSocket Server on Render's required port binding
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Global Production Matchmaking Hub live on port ${PORT}...`);
});

// Storage for active game rooms
// Format: { "ROOM_CODE": { host: ws, clients: [ws1, ws2] } }
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
        if (line === "ROLE:HOST") {
            const roomCode = generateRoomCode();
            
            ws.roomCode = roomCode;
            ws.isHost = true;

            gameRooms[roomCode] = {
                host: ws,
                clients: [ws]
            };

            console.log(`-> LOBBY CREATED: Code [${roomCode}]`);
            ws.send(`ROOM_CODE:${roomCode}`);
            return;
        }
        
        // 2. GLOBAL ROLE AUTHENTICATION: JOINER CONNECTION
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
