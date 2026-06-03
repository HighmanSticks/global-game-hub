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

wss.on('connection', (ws) => {
    ws.roomCode = null;
    ws.isHost = false;

    ws.on('message', (message) => {
        const line = message.toString().trim();
        if (line.length === 0) return;

        // BUG FIX 1: Answer the Heartbeat
        if (line === "KEEPALIVE_PING") {
            ws.send("KEEPALIVE_PONG");
            return;
        }

        if (line.startsWith("GET_LOBBIES:")) {
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
            const roomCode = generateRoomCode();
            ws.roomCode = roomCode;
            ws.isHost = true;
            gameRooms[roomCode] = { host: ws, clients: [ws], isPublic: false };
            ws.send(`ROOM_CODE:${roomCode}`);
            return;
        }

        if (line.startsWith("CREATE_PUBLIC:")) {
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
        
        if (line.indexOf("ROLE:CLIENT:") === 0) {
            const targetCode = line.split(":")[2].toUpperCase();

            if (!gameRooms[targetCode]) {
                console.log(`-> Join attempt failed: Room [${targetCode}] does not exist.`);
                ws.send("ERROR:ROOM_NOT_FOUND");
                // BUG FIX 2: Removed ws.close() here! The Joiner's socket stays open so they can keep browsing!
                return;
            }

            const room = gameRooms[targetCode];
            
            // BUG FIX 3: Prevent duplicate client entries if they rejoin the same room
            if (ws.roomCode && gameRooms[ws.roomCode]) {
                const oldRoom = gameRooms[ws.roomCode];
                const index = oldRoom.clients.indexOf(ws);
                if (index !== -1) oldRoom.clients.splice(index, 1);
            }

            ws.roomCode = targetCode;
            ws.isHost = false;
            
            if (!room.clients.includes(ws)) {
                room.clients.push(ws);
            }
            
            console.log(`-> JOINER entered Room [${targetCode}].`);
            room.host.send("J"); 
            ws.send("AUTH_OK"); 
            return;
        }

        if (ws.roomCode && gameRooms[ws.roomCode]) {
            const room = gameRooms[ws.roomCode];
            room.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) client.send(line);
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
            }
        }
    });
});
