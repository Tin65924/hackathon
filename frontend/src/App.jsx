import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [ws, setWs] = useState(null);

  // Connect WebSocket
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080"); // backend URL
    setWs(socket);

    socket.onopen = () => console.log("[WS] Connected to backend");
    socket.onclose = () => console.log("[WS] Disconnected");
    socket.onerror = (err) => console.error("[WS] Error:", err);

    return () => socket.close();
  }, []);

  // Send frames every 150ms
  useEffect(() => {
    if (!ws) return;

    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();

        ws.send(
          JSON.stringify({
            type: "frame",
            data: imageSrc,
          })
        );
      }
    }, 150);

    return () => clearInterval(interval);
  }, [ws]);

  // Handle YOLO detection results
  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === "detections") {
        drawDetections(data.boxes);
      }
    };
  }, [ws]);

  // Draw bounding boxes on canvas
  function drawDetections(boxes) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = webcamRef.current.video.videoWidth;
    canvas.height = webcamRef.current.video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    boxes.forEach((box) => {
      const { x1, y1, x2, y2, label } = box;

      ctx.strokeStyle = "rgb(255,125,186)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.fillStyle = "rgba(0,255,0,0.7)";
      ctx.font = "14px Arial";
      ctx.fillText(label, x1, y1 - 5);
    });
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h2>YOLO Object Detection (React Frontend)</h2>

      <div style={{ position: "relative", display: "inline-block" }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          style={{ width: 640, height: 480 }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 640,
            height: 480,
          }}
        />
      </div>
    </div>
  );
}

export default App;
