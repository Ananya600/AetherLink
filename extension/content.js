const PARTNER_B_IP = '192.168.137.126'; 
let socket;
let peer = new Peer();

// 1. Initialize Peer & Signaling Socket
peer.on('open', (id) => {
    console.log('%c📡 Aether-Link Node Active', 'color: #00ff00; font-weight: bold;');
    console.log('Your Peer ID:', id);
    window.myPeerId = id;
    connectToSignaler(id);
});

function connectToSignaler(id) {
    socket = new WebSocket(`ws://${PARTNER_B_IP}:8001/ws/${id}`);

    socket.onopen = () => {
        console.log("%c✅ Connected to Signaling Server", "color: #bada55;");
    };

    socket.onmessage = (event) => {
        const signal = JSON.parse(event.data);
        if (signal.type === "MATCH_SIGNAL") {
            console.log(`%c🔗 Automated Match! Connecting to: ${signal.target_id}`, "color: #ffa500; font-weight: bold;");
            
            let conn = peer.connect(signal.target_id);
            conn.on('open', () => {
                conn.send({
                    vector: window.myVector,
                    topic: document.title || "Research Node"
                });
            });
        }
    };

    socket.onclose = () => {
        console.warn("⚠️ Signaler connection lost. Retrying in 3s...");
        setTimeout(() => connectToSignaler(id), 3000);
    };
}

// 2. Helper: Get Vector from Brain
async function getVectorFromBrain(text) {
    console.log(`🧠 Vectorizing: "${text}"`);
    const response = await fetch(`http://${PARTNER_B_IP}:8000/vectorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    });
    return await response.json();
}

// 3. P2P Listener
peer.on('connection', (conn) => {
    conn.on('data', async (remoteData) => {
        console.log("%c📥 Incoming P2P Data Received!", "color: #00acee; font-weight: bold;");
        
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
            console.log(`📊 Semantic Similarity: ${(result.similarity * 100).toFixed(2)}%`);

            if (result.match) {
                console.log(`%c🚀 MATCH! Peer researching: "${remoteData.topic}"`, "color: #ff00ff; font-weight: bold;");
                // The Alert is the "Hero" of the demo
                alert(`🚀 Aether-Link Match! \nA peer nearby is also researching: "${remoteData.topic}"`);
            }
        } catch (e) {
            console.error("Comparison failed. Is Partner B's Brain running?");
        }
    });
});

// 4. Universal Auto-Run Logic
async function initAetherLink() {
    const pageText = document.title || "Research Node";
    
    try {
        const data = await getVectorFromBrain(pageText);
        window.myVector = data.vector;
        console.log("%c✅ Vector Identity Secured.", "color: #00ff00;");

        // Loop until socket is ready to announce
        const announce = () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "ANNOUNCE",
                    vector: window.myVector,
                    topic: pageText
                }));
                console.log("📣 Intent broadcasted to mesh.");
            } else {
                setTimeout(announce, 500); // Retry every half second
            }
        };
        announce();

    } catch (e) {
        console.error("❌ Auto-broadcast failed. Check Brain/Signaler IP!");
    }
}

// Start when the page is stable
if (document.readyState === 'complete') {
    initAetherLink();
} else {
    window.addEventListener('load', initAetherLink);
}
