from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import tensorflow as tf
import numpy as np
from pathlib import Path
import json

app = FastAPI(title="AgriDoctor API")

MODEL_PATH = Path("Models/best_mnv2_v2.keras")
ADVISORY_PATH = Path("advisories.json")

with open(ADVISORY_PATH, "r", encoding="utf-8") as f:
    advisories = json.load(f)

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)

print("AgriDoctor AI model loaded successfully!")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "AgriDoctor backend is running!"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    image_data = await file.read()

    image = Image.open(io.BytesIO(image_data))

    image = image.convert("RGB")

    image = image.resize((160, 160))

    image_array = np.array(image) / 255.0

    image_array = np.expand_dims(image_array, axis=0)

    predictions = model.predict(image_array)

    predicted_class = int(
        np.argmax(predictions[0])
    )

    confidence = float(
        np.max(predictions[0]) * 100
    )

    if confidence >= 70:
        confidence_status = "High confidence"
    elif confidence >= 40:
        confidence_status = "Moderate confidence"
    else:
        confidence_status = (
            "Low confidence - please take a clearer leaf photo"
        )

    labels = [
        "Apple - Apple Scab",
        "Apple - Black Rot",
        "Apple - Cedar Apple Rust",
        "Apple - Healthy",
        "Blueberry - Healthy",
        "Cherry - Powdery Mildew",
        "Cherry - Healthy",
        "Corn - Cercospora Leaf Spot / Gray Leaf Spot",
        "Corn - Common Rust",
        "Corn - Northern Leaf Blight",
        "Corn - Healthy",
        "Grape - Black Rot",
        "Grape - Esca (Black Measles)",
        "Grape - Leaf Blight",
        "Grape - Healthy",
        "Orange - Citrus Greening",
        "Peach - Bacterial Spot",
        "Peach - Healthy",
        "Bell Pepper - Bacterial Spot",
        "Bell Pepper - Healthy",
        "Potato - Early Blight",
        "Potato - Late Blight",
        "Potato - Healthy",
        "Raspberry - Healthy",
        "Soybean - Healthy",
        "Squash - Powdery Mildew",
        "Strawberry - Leaf Scorch",
        "Strawberry - Healthy",
        "Tomato - Bacterial Spot",
        "Tomato - Early Blight",
        "Tomato - Late Blight",
        "Tomato - Leaf Mold",
        "Tomato - Septoria Leaf Spot",
        "Tomato - Spider Mites",
        "Tomato - Target Spot",
        "Tomato - Tomato Yellow Leaf Curl Virus",
        "Tomato - Tomato Mosaic Virus",
        "Tomato - Healthy"
    ]

    disease = labels[predicted_class]

    advisory = advisories.get(
        disease,
        {
            "advisory": (
                "Please monitor the crop regularly "
                "and consult a local agricultural expert "
                "for disease-specific treatment advice."
            ),
            "advisory_tamil": (
                "பயிரை தொடர்ந்து கண்காணிக்கவும். "
                "நோய்க்கான குறிப்பிட்ட சிகிச்சை ஆலோசனைக்கு "
                "உள்ளூர் வேளாண்மை நிபுணரை அணுகவும்."
            )
        }
    )

    return {
        "filename": file.filename,
        "image_type": image.format,
        "predicted_class": predicted_class,
        "disease": disease,
        "confidence": round(confidence, 2),
        "confidence_status": confidence_status,
        "advisory": advisory.get(
            "advisory",
            "Please consult a local agricultural expert."
        ),
        "advisory_tamil": advisory.get(
            "advisory_tamil",
            "உள்ளூர் வேளாண்மை நிபுணரை அணுகவும்."
        ),
        "message": "AI prediction completed successfully!"
    }