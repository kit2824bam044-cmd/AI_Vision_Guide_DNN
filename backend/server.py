from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np

app = Flask(__name__)


# -----------------------------
# CORS
# -----------------------------
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# -----------------------------
# Load YOLO model
# -----------------------------
model = YOLO("yolo26n.pt")


# -----------------------------
# Home
# -----------------------------
@app.route("/")
def home():
    return jsonify({
        "status": "running",
        "message": "AI Vision Guide Backend is working"
    })


# -----------------------------
# Test
# -----------------------------
@app.route("/test")
def test():
    return jsonify({
        "message": "Backend connected successfully"
    })


# -----------------------------
# Detection
# -----------------------------
@app.route("/detect", methods=["POST"])
def detect():

    if "image" not in request.files:
        return jsonify({
            "error": "No image received"
        }), 400

    file = request.files["image"]

    image_bytes = file.read()

    image_array = np.frombuffer(
        image_bytes,
        np.uint8
    )

    frame = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if frame is None:
        return jsonify({
            "error": "Invalid image"
        }), 400

    frame_height, frame_width = frame.shape[:2]

    frame_area = frame_width * frame_height

    results = model(
        frame,
        verbose=False
    )

    objects = []

    # -----------------------------
    # Process YOLO results
    # -----------------------------
    for result in results:

        for box in result.boxes:

            confidence = float(box.conf[0])

            if confidence < 0.50:
                continue

            # Get class ID
            class_id = int(box.cls[0])

            # Get object name
            object_name = model.names[class_id]

            # Get bounding box
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Object size
            object_width = x2 - x1
            object_height = y2 - y1

            object_area = (
                object_width * object_height
            )

            # Area ratio
            area_ratio = (
                object_area / frame_area
            )

            # -----------------------------
            # Distance
            # -----------------------------
            if area_ratio > 0.30:
                distance = "Very Close"

            elif area_ratio > 0.10:
                distance = "Medium"

            else:
                distance = "Far"

            # -----------------------------
            # Object center
            # -----------------------------
            object_center_x = (
                x1 + x2
            ) / 2

            # -----------------------------
            # Direction
            # -----------------------------
            if object_center_x < frame_width * 0.35:

                direction = "Left"

            elif object_center_x > frame_width * 0.65:

                direction = "Right"

            else:

                direction = "Center"

            # -----------------------------
            # Add detection
            # -----------------------------
            objects.append({
                "name": object_name,
                "confidence": round(
                    confidence,
                    2
                ),
                "distance": distance,
                "direction": direction,
                "box": {
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2)
                }
            })

    # -----------------------------
    # Response
    # -----------------------------
    return jsonify({
        "objects": objects
    })


# -----------------------------
# Start server
# -----------------------------
if __name__ == "__main__":

    print("")
    print("==============================")
    print("     AI VISION GUIDE")
    print("==============================")
    print(
        "Server: http://127.0.0.1:5000"
    )
    print("")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )