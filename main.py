import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
import math
import uvicorn

app = FastAPI()

# 1. Setup CORS (Essential for the Extension)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load the AI
print("--- Loading AI Model ---")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("--- AI Brain is Ready! ---")

# 3. Define Data Models
class WebPage(BaseModel):
    text: str

# 4. Define Logic Functions
def calculate_similarity(v1, v2):
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(a * a for a in v2))
    if not magnitude1 or not magnitude2:
        return 0
    return dot_product / (magnitude1 * magnitude2)

# 5. Define Endpoints
@app.post("/vectorize")
async def vectorize(item: WebPage):
    vector = model.encode(item.text).tolist()
    return {"vector": vector[:16]} 

@app.post("/compare")
async def compare(data: dict):
    try:
        # 1. Extract vectors and convert to numpy arrays
        v1 = np.array(data.get('vector1'))
        v2 = np.array(data.get('vector2'))

        # 2. Check if vectors are valid
        if v1 is None or v2 is None or len(v1) == 0:
            return {"similarity": 0, "match": False, "error": "Empty vector"}

        # 3. Calculate similarity
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return {"similarity": 0, "match": False}

        score = float(np.dot(v1, v2) / (norm1 * norm2))
        
        print(f"DEBUG: Calculated Similarity: {score}") # Watch this in your terminal!
        
        return {
            "similarity": score,
            "match": score > 0.5  # Very forgiving threshold for demo
        }
    except Exception as e:
        print(f"CRASH: {e}")
        return {"similarity": 0, "match": False, "error": str(e)}

# 6. Start the Server (Must be at the very bottom)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
