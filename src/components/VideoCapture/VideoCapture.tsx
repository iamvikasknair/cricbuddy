import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, Square, Circle, Play, Pause } from 'lucide-react';

interface VideoCaptureProps {
  onVideoReady: (src: string, type: 'webcam' | 'upload') => void;
  onRecordingComplete: (blob: Blob) => void;
}

export function VideoCapture({ onVideoReady, onRecordingComplete }: VideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'select' | 'webcam' | 'upload'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' }, // soft constraint — works on laptops too
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode('webcam');
    } catch (err) {
      console.error('Webcam access denied:', err);
      alert('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      onVideoReady(url, 'webcam');
      onRecordingComplete(blob);
    };
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  }, [onVideoReady, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'recording') {
      recorder.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    } else if (recorder.state === 'paused') {
      recorder.resume();
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      setIsPaused(false);
    }
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setMode('upload');
      onVideoReady(url, 'upload');
    },
    [onVideoReady],
  );

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (mode === 'select') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-white mb-2">Start Batting Analysis</h2>
          <p className="text-slate-400">Record live or upload existing footage</p>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={startWebcam}
            className="flex items-center gap-3 px-8 py-5 rounded-2xl glass glow-green hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Camera size={24} className="text-green-400" />
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-lg">Live Camera</div>
              <div className="text-slate-400 text-sm">Record from webcam</div>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-8 py-5 rounded-2xl glass glow-gold hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Upload size={24} className="text-yellow-400" />
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-lg">Upload Video</div>
              <div className="text-slate-400 text-sm">MP4, WebM, MOV</div>
            </div>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-black/40">
        <video
          ref={videoRef}
          className="w-full aspect-video object-cover"
          autoPlay
          muted
          playsInline
        />
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
            <div className="recording-dot" />
            <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {mode === 'webcam' && (
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all cursor-pointer"
            >
              <Circle size={18} />
              Start Recording
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="flex items-center gap-2 px-5 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-semibold transition-all cursor-pointer"
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all cursor-pointer"
              >
                <Square size={18} />
                Stop & Analyse
              </button>
            </>
          )}
          <button
            onClick={() => {
              streamRef.current?.getTracks().forEach(t => t.stop());
              setMode('select');
              setIsRecording(false);
            }}
            className="px-4 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
