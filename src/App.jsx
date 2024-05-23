import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

function App() {
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Handle incoming audio data
    socket.on("audio to client", (data) => {
      console.log(`playing`);
      playAudio(data);
    });

    // return () => {
    //   socket.disconnect();
    // };
  }, []);

  const startAudioCapture = async () => {
    if (isCapturing) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    } else if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContextRef.current.createMediaStreamSource(stream);

    const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const inputDataArray = Float32Array.from(inputData);
      socket.emit("audio to server", inputDataArray);
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);

    processorRef.current = processor;
    setIsCapturing(true);
  };

  const stopAudioCapture = () => {
    if (!isCapturing) return;

    processorRef.current.disconnect();
    processorRef.current = null;
    setIsCapturing(false);
  };

  const playAudio = (audioData) => {
    const audioBuffer = new Float32Array(audioData);
    const buffer = audioContextRef.current.createBuffer(
      1,
      audioBuffer.length,
      audioContextRef.current.sampleRate
    );
    buffer.copyToChannel(audioBuffer, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  return (
    <div className="App">
      <h1>Audio Meet</h1>
      <button onClick={startAudioCapture} disabled={isCapturing}>
        Start Audio Capture
      </button>
      <button onClick={stopAudioCapture} disabled={!isCapturing}>
        Stop Audio Capture
      </button>
      <audio autoPlay />
    </div>
  );
}

export default App;
