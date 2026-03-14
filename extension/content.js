// USE PARTNER B's IPv4 ADDRESS HERE
const PARTNER_B_IP = '192.168.137.126'; 

let peer = new Peer(); 

peer.on('open', (id) => {
    console.log('%c📡 Aether-Link Node Active', 'color: #00ff00; font-weight: bold;');
    console.log('Your Peer ID:', id);
    window.myPeerId = id;
});

// Helper to get vector from Partner B's FastAPI
async function getVectorFromBrain(text) {
    console.log(`🧠 Sending "${text}" to Brain for vectorization...`);
    const response = await fetch(`http://${PARTNER_B_IP}:8000/vectorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    });
    return await response.json();
}

// Function to handle incoming P2P connections
peer.on('connection', (conn) => {
    conn.on('data', async (remoteData) => {
        console.log("%c📥 Incoming P2P Data Received!", "color: #00acee; font-weight: bold;");
        console.log("Peer is researching:", remoteData.topic);
        console.log("Requesting Semantic Comparison from Brain...");
        
        try {
            const comparison = await fetch(`http://${PARTNER_B_IP}:8000/compare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vector1: window.myVector,
                    vector2: remoteData.vector
                })
            });
            
            const result = await comparison.json();
            console.log(`📊 Similarity Score: ${result.similarity}`);

            if (result.match) {
                const matchMsg = `🚀 INTENT MATCH FOUND! \nTopic: "${remoteData.topic}"`;
                console.log(`%c${matchMsg}`, "color: #ff00ff; font-size: 16px; font-weight: bold;");
                // Try alert, but console is the backup
                alert(matchMsg);
            } else {
                console.log("%cNo match found. Topics are semantically distant.", "color: #888;");
            }
        } catch (e) {
            console.error("Comparison failed. Is the Brain still running at " + PARTNER_B_IP + "?");
        }
    });
});

// Listen for the "Broadcast" command from popup.html
chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === "broadcast") {
        const pageText = document.title || "Distributed Mesh Networks and AI";
        console.log("%c📣 Broadcasting Intent...", "color: #ffa500; font-weight: bold;");
        
        try {
            const data = await getVectorFromBrain(pageText);
            window.myVector = data.vector;
            
            console.log("%c✅ Vector Identity Secured.", "color: #00ff00;");
            
            let peerToConnect = prompt("Enter a Peer ID to link with:");
            if (peerToConnect) {
                console.log(`🔗 Attempting P2P Handshake with: ${peerToConnect}`);
                let conn = peer.connect(peerToConnect);
                conn.on('open', () => {
                    console.log("🤝 Connection Open! Sending vector data...");
                    conn.send({
                        vector: window.myVector,
                        topic: pageText
                    });
                });
            }
        } catch (err) {
            console.error("❌ Connection failed. Check Partner B's IP, Port 8000, and Chrome Flags!");
            console.log("Current target IP:", PARTNER_B_IP);
        }
    }
});
