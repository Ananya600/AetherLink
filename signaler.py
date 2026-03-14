from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json

app = FastAPI()

# Store active users: {peer_id: {"vector": [...], "socket": websocket}}
active_users = {}

@app.websocket("/ws/{peer_id}")
async def websocket_endpoint(websocket: WebSocket, peer_id: str):
    await websocket.accept()
    active_users[peer_id] = {"socket": websocket, "vector": None}
    print(f"📡 Node {peer_id} joined the mesh.")

    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "ANNOUNCE":
                my_vector = data["vector"]
                active_users[peer_id]["vector"] = my_vector
                
                # Check for matches with other users
                for other_id, info in active_users.items():
                    if other_id != peer_id and info["vector"] is not None:
                        # Automated Matchmaking (Simplified comparison)
                        # In production, use the /compare logic here
                        await info["socket"].send_json({
                            "type": "MATCH_SIGNAL",
                            "target_id": peer_id
                        })
    except WebSocketDisconnect:
        del active_users[peer_id]
        print(f"❌ Node {peer_id} left.")