import base64
import cv2
import numpy as np
import asyncio
import websockets
from ultralytics import YOLO

model = YOLO("yolov8s.pt")

async def handle_client(websocket):
    print("[WS] Client connected")

    while True:
        message = await websocket.recv()
        data = json.loads(message)

        if data["type"] == "frame":
            img_bytes = data["data"].split(",")[1]
            img = base64.b64decode(img_bytes)
            nparr = np.frombuffer(img, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # YOLO inference
            results = model(frame)

            detections = []
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    label = f"{model.names[cls]} {conf:.2f}"

                    detections.append({
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "label": label
                    })

            await websocket.send(
                json.dumps({
                    "type": "detections",
                    "boxes": detections
                })
            )

async def main():
    async with websockets.serve(handle_client, "localhost", 8080):
        print("[WS] YOLO WebSocket server running on ws://localhost:8080")
        await asyncio.Future()

asyncio.run(main())
