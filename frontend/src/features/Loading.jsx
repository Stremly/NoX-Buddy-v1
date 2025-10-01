import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Loading() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Please wait while we connect to the backend...");
  const [progress, setProgress] = useState(0); // for progress bar
  const [fade, setFade] = useState(true); // for smooth text transitions


  useEffect(() => {
    const backendURL = "http://127.0.0.1:8000"; // backend URL
    let attempts = 0;
    const maxAttempts = 10; // max retries (~10s)

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const checkBackend = async () => {
      attempts++;
      try {
        const res = await axios.get(`${backendURL}/ready`);
        if (res.status === 200 && res.data.status === "ready") {
          setFade(false);
          await delay(500);
          setStatus("Backend connected! Redirecting...");
          setFade(true);

          // Smooth progress animation
          let prog = progress;
          const progInterval = setInterval(() => {
            prog += 5;
            if (prog >= 100) {
              clearInterval(progInterval);
              navigate("/home");
            }
            setProgress(prog);
          }, 50);
        } else {
          // Backend returned some error/status not ready
          setFade(false);
          await delay(300);
          setStatus("Backend is not ready. Please try again later.");
          setFade(true);
          setTimeout(() => window.electronAPI.quitApp(), 2000); // close app after 2s
        }

      } catch (err) {
        if (attempts >= maxAttempts) {
          setFade(false);
          await delay(500);
          setStatus("Backend not connected. Please try again later.");
          setFade(true);
          setTimeout(() => window.electronAPI.quitApp(), 2000);
        } else {
          setFade(false);
          await delay(300);
          setStatus("Backend not ready yet... please wait.");
          setFade(true);
        }
      }
    };

    delay(1000).then(() => {
      checkBackend();
      const intervalId = setInterval(checkBackend, 1000);
      return () => clearInterval(intervalId);
    });
  }, [navigate]);

  return { status, progress, fade };
}
