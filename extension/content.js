// USE PARTNER B's IPv4 ADDRESS HERE
const PARTNER_B_IP = '192.168.137.126'; 

let peer = new Peer(); 

peer.on('open', (id) => {
    console.log('Aether-Link Node Active. ID:', id);
    // Keep track of our own ID so we can share it
    window.myPeerId = id;
});

// Helper to get vector from Partner B's FastAPI
async function getVectorFromBrain(text) {
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
        console.log("Received vector from a peer! Comparing...");
        
        // Ask Partner B to compare the two vectors
        const comparison = await fetch(`http://${PARTNER_B_IP}:8000/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vector1: window.myVector,
                vector2: remoteData.vector
            })
        });
        
        const result = await comparison.json();
        if (result.match) {
            alert(`🚀 INTENT MATCH! Peer is researching: "${remoteData.topic}"`);
        }
    });
});

// Listen for the "Broadcast" command from popup.html
chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === "broadcast") {
        const pageText = document.title; // Using title for faster processing
        
        try {
            const data = await getVectorFromBrain(pageText);
            window.myVector = data.vector; // Store it globally
            
            console.log("Vector ready. Now connect to a peer!");
            
            // HACKATHON SHORTCUT: 
            // Ask for a Peer ID to connect to (In a real app, this is automated)
            let peerToConnect = prompt("Enter a Peer ID to link with:");
            if (peerToConnect) {
                let conn = peer.connect(peerToConnect);
                conn.on('open', () => {
                    conn.send({
                        vector: window.myVector,
                        topic: pageText
                    });
                });
            }
        } catch (err) {
            console.error("Connection failed. Partner B, check IP and Port 8000!");
        }
    }
});