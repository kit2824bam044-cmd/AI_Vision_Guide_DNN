from ultralytics import YOLO
import cv2
import pyttsx3
import time

# Load YOLO model
model = YOLO("yolo26n.pt")

# Text-to-Speech
engine = pyttsx3.init()
engine.setProperty("rate", 160)
engine.setProperty("volume", 1.0)

# Open laptop camera
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Camera not found")
    exit()

# Voice control
last_spoken = []
last_time = 0

print("AI Vision Guide started...")
print("Press Q to close.")

while True:

    # Read camera frame
    ret, frame = cap.read()

    if not ret:
        print("Unable to read camera")
        break

    # Run YOLO detection
    results = model(frame, verbose=False)

    # Store detected objects
    detected_objects = []

    for result in results:

        for box in result.boxes:

            confidence = float(box.conf[0])

            # Only accept confident detections
            if confidence >= 0.50:

                class_id = int(box.cls[0])

                object_name = model.names[class_id]

                detected_objects.append(object_name)

    # Remove duplicate object names
    unique_objects = list(dict.fromkeys(detected_objects))

    # Draw boxes on camera
    annotated_frame = results[0].plot()

    # Voice alert
    if unique_objects:

        current_time = time.time()

        if (
            unique_objects != last_spoken
            or current_time - last_time >= 3
        ):

            message = ", ".join(unique_objects) + " detected"

            print("AI:", message)

            engine.say(message)
            engine.runAndWait()

            last_spoken = unique_objects.copy()
            last_time = current_time

    # Show camera
    cv2.imshow("AI Vision Guide", annotated_frame)

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Close everything
cap.release()
cv2.destroyAllWindows()

print("AI Vision Guide stopped.")