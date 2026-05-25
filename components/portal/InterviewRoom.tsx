"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, Camera, CheckCircle2, Clock, ChevronRight, Square } from "lucide-react";
import * as faceapi from "face-api.js";
import { SimliClient, generateSimliSessionToken, generateIceServers } from "simli-client";
import {
  startInterview,
  submitAnswer,
  completeInterview,
  type InterviewData,
} from "@/app/actions/interviews";

const SIMLI_API_KEY = process.env.NEXT_PUBLIC_SIMLI_API_KEY ?? "";
const SIMLI_FACE_ID = process.env.NEXT_PUBLIC_SIMLI_FACE_ID ?? "tmp9i8bbkX8";

type Phase = "preCheck" | "starting" | "welcome" | "active" | "analyzing" | "complete";
type RecordingState = "idle" | "recording" | "transcribing" | "recorded";
type DeviceStatus = "checking" | "ok" | "error";

function generateFallbackQuestions(job: NonNullable<InterviewData["job"]>): string[] {
  return [
    `Tell me about yourself and what draws you to the ${job.title} role at ${job.company}.`,
    "Describe a challenging project you've worked on. What was your role and what did you accomplish?",
    "How do you approach problem-solving when you encounter an unfamiliar technical challenge?",
    "Tell me about a time you had to collaborate closely with a team to deliver under a tight deadline.",
    "What's your approach to learning new technologies or skills quickly?",
    "Describe a situation where you had to make an important decision with limited information.",
    "How do you prioritize tasks when you have multiple competing deadlines?",
    "Tell me about a time you received constructive feedback. How did you respond to it?",
    "What does success look like to you in the first 90 days in this role?",
    "Do you have any questions about the team, the role, or the company culture?",
  ].slice(0, job.carl_max_questions ?? 10);
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function CarlAvatar({ size = "md", speaking = false }: { size?: "sm" | "md" | "lg"; speaking?: boolean }) {
  const dim = { sm: "w-9 h-9", md: "w-14 h-14", lg: "w-20 h-20" };
  return (
    <div className="relative flex-shrink-0">
      {speaking && <div className={`absolute inset-0 rounded-full bg-indigo-500/40 animate-ping`} />}
      <div className={`${dim[size]} rounded-full overflow-hidden shadow-lg shadow-indigo-500/30 ring-2 ${speaking ? "ring-indigo-400/70" : "ring-indigo-400/20"} relative z-10`}>
        <img src="/carl_avatar.png" alt="Carl" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const heights = [3, 5, 8, 12, 9, 6, 11, 7, 4, 10, 8, 5, 9, 6, 3];
  return (
    <div className="flex items-end gap-1 h-14">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all duration-300 ${active ? "bg-red-400" : "bg-slate-600"}`}
          style={
            active
              ? { height: `${h * 3}px`, animation: `waveform ${0.5 + (i % 5) * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 40}ms` }
              : { height: "4px" }
          }
        />
      ))}
    </div>
  );
}

function DeviceRow({ label, status }: { label: string; status: DeviceStatus }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-300 text-sm">{label}</span>
      {status === "checking" && <span className="text-slate-500 text-xs">Checking…</span>}
      {status === "ok" && (
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ready
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Not detected
        </span>
      )}
    </div>
  );
}

async function blobToPCM16(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  try {
    const buf = await ctx.decodeAudioData(arrayBuffer);
    const channel = buf.getChannelData(0);
    const pcm = new Int16Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return new Uint8Array(pcm.buffer);
  } finally {
    await ctx.close();
  }
}

export default function InterviewRoom({ interview }: { interview: InterviewData }) {
  const router = useRouter();
  const job = interview.job!;
  const candidate = interview.candidate!;
  const mode = (interview.mode ?? "text") as "text" | "voice" | "video";
  const firstName = candidate.full_name.split(" ")[0];

  const [phase, setPhase] = useState<Phase>(() => {
    if (interview.status === "completed") return "complete";
    if (interview.status === "started") return "active";
    return "preCheck";
  });

  const [questions, setQuestions] = useState<string[]>(() =>
    interview.questions?.length
      ? (interview.questions as string[])
      : generateFallbackQuestions(job)
  );
  const [questionIndex, setQuestionIndex] = useState(() => interview.responses?.length ?? 0);
  const [answer, setAnswer] = useState("");
  const [carlAck, setCarlAck] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micStatus, setMicStatus] = useState<DeviceStatus>("checking");
  const [camStatus, setCamStatus] = useState<DeviceStatus>("checking");
  const [recording, setRecording] = useState<RecordingState>("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [carlSpeaking, setCarlSpeaking] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [sttBlocked, setSttBlocked] = useState(false);
  const [browserWarning, setBrowserWarning] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [needsResumeClick, setNeedsResumeClick] = useState(
    () => phase === "active" && (mode === "voice" || mode === "video") && interview.status === "started"
  );

  // Simli state (video mode)
  const [simliConnected, setSimliConnected] = useState(false);
  const simliConnectedRef = useRef(false);

  // Camera preview + face detection (preCheck phase)
  type FaceStatus = "checking" | "detected" | "not_detected" | "unsupported";
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("checking");
  const [faceConfirmed, setFaceConfirmed] = useState(false);
  const camPreviewRef = useRef<HTMLVideoElement>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const confirmedTextRef = useRef("");
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const pendingVoiceAnswerRef = useRef("");
  const questionIndexRef = useRef(questionIndex);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitAndAdvanceRef = useRef<((answer: string) => Promise<void>) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  // Simli refs (imperative elements so they persist across phase transitions)
  const simliRef = useRef<SimliClient | null>(null);
  const simliVideoEl = useRef<HTMLVideoElement | null>(null);
  const simliAudioEl = useRef<HTMLAudioElement | null>(null);
  const simliContainerRef = useRef<HTMLDivElement | null>(null);

  questionIndexRef.current = questionIndex;

  useEffect(() => {
    if (mode === "text") { setMicStatus("ok"); setCamStatus("ok"); return; }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setMicStatus("ok"))
      .catch(() => setMicStatus("error"));
    if (mode === "video") {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => { setCamStatus("ok"); s.getTracks().forEach((t) => t.stop()); })
        .catch(() => setCamStatus("error"));
    } else {
      setCamStatus("ok");
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "text") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.brave?.isBrave) {
      nav.brave.isBrave().then((yes: boolean) => { if (yes) setBrowserWarning(true); });
    }
  }, [mode]);

  // Camera preview + face detection during preCheck
  useEffect(() => {
    if (phase !== "preCheck" || mode !== "video") return;
    let active = true;

    (async () => {
      try {
        // Load TinyFaceDetector model (served locally from /public/models/)
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        camStreamRef.current = stream;
        if (camPreviewRef.current) camPreviewRef.current.srcObject = stream;

        // Wait a frame for the video element to have data before detecting
        await new Promise((r) => setTimeout(r, 500));

        faceIntervalRef.current = setInterval(async () => {
          if (!camPreviewRef.current || !active) return;
          if (camPreviewRef.current.readyState < 2) return;
          try {
            const detection = await faceapi.detectSingleFace(
              camPreviewRef.current,
              new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 })
            );
            if (active) setFaceStatus(detection ? "detected" : "not_detected");
          } catch { /* ignore mid-frame errors */ }
        }, 800);
      } catch { /* permission denied — camStatus already reflects this */ }
    })();

    return () => {
      active = false;
      if (faceIntervalRef.current) { clearInterval(faceIntervalRef.current); faceIntervalRef.current = null; }
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
    };
  }, [phase, mode, camStatus]);

  useEffect(() => {
    if (phase !== "active") return;
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Clean up Simli on unmount
  useEffect(() => {
    return () => {
      simliRef.current?.stop().catch(() => {});
      simliRef.current = null;
      simliVideoEl.current?.remove();
      simliVideoEl.current = null;
      simliAudioEl.current?.remove();
      simliAudioEl.current = null;
    };
  }, []);

  // Move Simli video element into its container when the active video layout mounts
  // Also re-runs when simliConnected changes, in case Simli connected after the phase transition
  useEffect(() => {
    if ((phase !== "active" && phase !== "welcome") || mode !== "video") return;
    if (!simliContainerRef.current || !simliVideoEl.current) return;
    const container = simliContainerRef.current;
    const video = simliVideoEl.current;
    video.style.cssText = "width:100%;height:100%;object-fit:contain;position:absolute;inset:0;background:#020617;";
    container.appendChild(video);
    return () => {
      video.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
      document.body.appendChild(video);
    };
  }, [phase, mode, simliConnected]);

  const initSimli = (): Promise<void> => {
    if (!SIMLI_API_KEY || simliRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      // Fallback: give up waiting after 10s and proceed anyway
      const timeout = setTimeout(resolve, 10000);

      (async () => {
        try {
          const video = document.createElement("video");
          video.autoplay = true;
          video.muted = true;
          (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
          video.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
          document.body.appendChild(video);

          const audio = document.createElement("audio");
          audio.autoplay = true;
          document.body.appendChild(audio);

          simliVideoEl.current = video;
          simliAudioEl.current = audio;

          const [tokenData, iceServers] = await Promise.all([
            generateSimliSessionToken({
              apiKey: SIMLI_API_KEY,
              config: {
                faceId: SIMLI_FACE_ID,
                handleSilence: true,
                maxSessionLength: 3600,
                maxIdleTime: 600,
                model: "fasttalk",
              },
            }),
            generateIceServers(SIMLI_API_KEY),
          ]);

          const client = new SimliClient(tokenData.session_token, video, audio, iceServers);
          simliRef.current = client;

          client.on("start", () => {
            simliConnectedRef.current = true;
            setSimliConnected(true);
            clearTimeout(timeout);
            resolve();
          });
          client.on("speaking", () => setCarlSpeaking(true));
          client.on("silent", () => setCarlSpeaking(false));

          await client.start();
        } catch {
          clearTimeout(timeout);
          resolve();
        }
      })();
    });
  };

  const handleResume = async () => {
    setNeedsResumeClick(false);
    if (mode === "video") await initSimli();
    await speakText(questions[questionIndex]);
    startRecordingRef.current?.();
  };

  const speakText = (text: string): Promise<void> => {
    if (mode === "text") return Promise.resolve();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setCarlSpeaking(true);
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        setCarlSpeaking(false);
        resolve();
      };

      const safetyTimer = setTimeout(done, 12000);
      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), 11000);

      fetch("/api/tts", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then(async (blob) => {
          clearTimeout(fetchTimer);
          clearTimeout(safetyTimer);

          if (mode === "video" && simliRef.current && simliConnectedRef.current) {
            try {
              const pcm = await blobToPCM16(blob);
              // Duration estimate: PCM16 = 2 bytes/sample at 16 kHz
              const durationMs = (pcm.byteLength / 2 / 16000) * 1000;
              simliRef.current.sendAudioData(pcm);
              // Resolve after estimated duration + latency buffer
              setTimeout(done, durationMs + 800);
            } catch {
              done();
            }
          } else {
            // Voice mode (or video before Simli connects): play audio directly
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => { URL.revokeObjectURL(url); done(); };
            audio.onerror = () => { URL.revokeObjectURL(url); done(); };
            audio.play().catch(() => {
              URL.revokeObjectURL(url);
              setTimeout(done, 2000);
            });
          }
        })
        .catch(() => {
          clearTimeout(fetchTimer);
          clearTimeout(safetyTimer);
          setTimeout(done, 3000);
        });
    });
  };

  const getCarlAck = async (question: string, answer: string, isLast: boolean): Promise<string> => {
    try {
      const res = await fetch("/api/carl-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          carlPersonality: job.carl_personality ?? "professional",
          question,
          answer,
          isLastQuestion: isLast,
        }),
      });
      if (!res.ok) return "";
      const data = await res.json();
      return (data.acknowledgment as string) ?? "";
    } catch {
      return "";
    }
  };

  const doComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("analyzing");
    await completeInterview(interview.id);
    setPhase("complete");
  };

  const submitAndAdvance = async (capturedAnswer: string) => {
    const capturedIndex = questionIndexRef.current;
    const isLast = capturedIndex + 1 >= questions.length;

    setIsSubmitting(true);
    setAnswer("");
    setRecording("idle");
    await submitAnswer(interview.id, {
      question: questions[capturedIndex],
      answer: capturedAnswer,
      submitted_at: new Date().toISOString(),
    });
    setIsSubmitting(false);

    const hasRealAnswer = !capturedAnswer.startsWith("[");
    setIsThinking(hasRealAnswer);
    const ack = hasRealAnswer ? await getCarlAck(questions[capturedIndex], capturedAnswer, isLast) : "";
    setIsThinking(false);

    if (ack) {
      setCarlAck(ack);
      if (mode !== "text") await speakText(ack);
      else await new Promise((resolve) => setTimeout(resolve, 2800));
      setCarlAck(null);
    }

    if (isLast) {
      await doComplete();
      return;
    }

    const nextIdx = capturedIndex + 1;
    setQuestionIndex(nextIdx);
    if (mode !== "text") {
      await speakText(questions[nextIdx]);
      startRecordingRef.current?.();
    }
  };
  submitAndAdvanceRef.current = submitAndAdvance;

  const handleStart = async () => {
    setPhase("starting");
    let finalQuestions = questions;
    if (!interview.questions?.length) {
      try {
        const res = await fetch("/api/carl-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: job.title,
            company: job.company,
            carlPersonality: job.carl_personality ?? "professional",
            carlTopics: job.carl_topics ?? [],
            maxQuestions: job.carl_max_questions ?? 10,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            finalQuestions = data.questions;
            setQuestions(finalQuestions);
          }
        }
      } catch { /* use fallback */ }
    }
    await startInterview(interview.id, finalQuestions);
    setPhase("welcome");

    const welcomeText = `Hi ${firstName}! Welcome to your interview for the ${job.title} role at ${job.company}. I'm Carl, your AI interviewer. I'll ask you ${finalQuestions.length} questions — take your time with each answer, there's no rush. Let's get started!`;
    setWelcomeMsg(welcomeText);

    // In video mode, wait for Simli to connect before speaking so audio and avatar are in sync
    if (mode === "video") await initSimli();

    if (mode !== "text") {
      await speakText(welcomeText);
    } else {
      await new Promise((r) => setTimeout(r, 4000));
    }

    setPhase("active");
    await speakText(finalQuestions[0]);
    if (mode !== "text") startRecording();
  };

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting || isThinking) return;
    const capturedAnswer = answer.trim();
    await submitAndAdvance(capturedAnswer);
  };

  const handleSkip = async () => {
    if (isThinking || isSubmitting) return;
    await submitAndAdvance("[skipped]");
  };

  const startRecording = async () => {
    transcriptRef.current = "";
    confirmedTextRef.current = "";
    chunksRef.current = [];
    isRecordingRef.current = true;
    setTranscript("");
    setRecording("recording");
    setRecSeconds(0);
    recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);

    if (mode === "video") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRef.current = recorder;
        recorder.start(500);
      } catch { /* permission denied */ }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSttBlocked(true);
      setRecording("idle");
      isRecordingRef.current = false;
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let sessionBuffer = "";
    let canRestart = true;

    recognition.onresult = (event: { results: SpeechRecognitionResultList; resultIndex: number }) => {
      let newFinals = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newFinals += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (newFinals) {
        sessionBuffer = (sessionBuffer + " " + newFinals).trim();
        confirmedTextRef.current = sessionBuffer;
      }
      transcriptRef.current = (sessionBuffer + (interim ? " " + interim : "")).trim();
      // Only update UI while actively recording — prevents post-stop events from overwriting the finalized transcript
      if (isRecordingRef.current) {
        setTranscript(transcriptRef.current);
      }
    };

    recognition.onend = () => {
      if (canRestart && isRecordingRef.current) {
        sessionBuffer = confirmedTextRef.current;
        try { recognition.start(); } catch { canRestart = false; }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        canRestart = false;
        speechRef.current = null;
        isRecordingRef.current = false;
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        setSttBlocked(true);
        setRecording("idle");
      }
    };

    recognition.start();
    speechRef.current = recognition;
  };
  startRecordingRef.current = startRecording;

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;

    if (mediaRef.current) {
      try {
        mediaRef.current.stream.getTracks().forEach((t) => t.stop());
        if (mediaRef.current.state !== "inactive") mediaRef.current.stop();
      } catch { /* ignore */ }
      mediaRef.current = null;
    }

    setRecording("transcribing");

    if (!speechRef.current) {
      const text = confirmedTextRef.current || transcriptRef.current;
      pendingVoiceAnswerRef.current = text;
      setTranscript(text);
      setRecording("recorded");
      return;
    }

    const recognition = speechRef.current;
    speechRef.current = null;

    const finalizeTranscript = () => {
      const text = (confirmedTextRef.current || transcriptRef.current).trim();
      pendingVoiceAnswerRef.current = text;
      setTranscript(text);
      setRecording("recorded");
    };

    recognition.onend = finalizeTranscript;

    try {
      recognition.stop();
    } catch {
      finalizeTranscript();
    }
  };

  const progress = questions.length ? (questionIndex / questions.length) * 100 : 0;
  const currentQ = questions[questionIndex] ?? "";

  const bubbleContent = isThinking ? null : carlAck ?? currentQ;
  const carlLabel = carlSpeaking ? "Carl is speaking…" : carlAck ? "Carl · responding" : "Carl · AI Interviewer";

  // --- PRE-CHECK ---
  if (phase === "preCheck" || phase === "starting") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CarlAvatar size="lg" />
            </div>
            <p className="text-indigo-300 font-semibold text-sm mb-1">Hi, I&apos;m Carl</p>
            <h1 className="text-2xl font-extrabold text-white">Welcome, {firstName}</h1>
            <p className="text-slate-400 mt-1 text-sm">{job.title} · {job.company}</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Interview Details</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Mode", value: mode.charAt(0).toUpperCase() + mode.slice(1) },
                { label: "Duration", value: `~${job.carl_duration ?? 30} min` },
                { label: "Questions", value: `~${job.carl_max_questions ?? 10}` },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/60 rounded-xl p-3">
                  <p className="text-white font-bold text-sm">{item.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Before You Start</p>
            <ul className="space-y-2.5">
              {[
                "Find a quiet, distraction-free space",
                "Read each question carefully before answering",
                "Answer as naturally and honestly as you can",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-indigo-400 text-xs font-bold">{i + 1}</span>
                  </div>
                  <span className="text-slate-300 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {mode !== "text" && (
            <div className="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Device Check</p>
              <div className="space-y-2.5">
                <DeviceRow label="Microphone" status={micStatus} />
                {mode === "video" && <DeviceRow label="Camera" status={camStatus} />}
              </div>

              {mode === "video" && camStatus === "ok" && (
                <div className="mt-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
                    <video
                      ref={camPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                      <div>
                        {faceStatus === "checking" && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-black/70 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                            Checking for face…
                          </span>
                        )}
                        {faceStatus === "detected" && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-black/70 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Person detected
                          </span>
                        )}
                        {faceStatus === "not_detected" && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-black/70 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            No face detected — adjust your position
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={
              phase === "starting" ||
              (mode === "video" && camStatus === "ok" &&
                (faceStatus === "not_detected"))
            }
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            {phase === "starting" ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Preparing your interview…
              </>
            ) : (
              <>Start Interview with Carl <ChevronRight className="w-5 h-5" /></>
            )}
          </button>

          <p className="text-center text-slate-600 text-xs mt-4 leading-relaxed">
            Carl uses AI to conduct this interview. Your responses will be recorded and analyzed.
          </p>
        </div>
      </div>
    );
  }

  // --- COMPLETE ---
  if (phase === "complete") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Interview Complete!</h1>
          <p className="text-slate-400 mb-8">
            Thank you, {firstName}. Carl has recorded all your responses.
          </p>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-6 text-left">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">What Happens Next</p>
            <div className="space-y-4">
              {[
                { title: "Carl analyzes your responses", sub: "AI-powered scoring and insights" },
                { title: "Our team reviews the report", sub: "Recruiters assess your fit" },
                { title: "You'll hear back within 5 business days", sub: "Via email or phone" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 text-xs font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{step.title}</p>
                    <p className="text-slate-500 text-xs">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => router.push("/portal")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl text-base transition-colors"
          >
            Return to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- WELCOME ---
  if (phase === "welcome") {
    if (mode === "video") {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
          {/* Carl video panel */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden">
            <div ref={simliContainerRef} className="absolute inset-0" />
            {!simliConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3">
                <CarlAvatar size="lg" speaking={carlSpeaking} />
                <p className="text-slate-500 text-xs">Connecting avatar…</p>
              </div>
            )}
            <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${carlSpeaking ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
              <span className="text-white text-xs font-medium">{carlSpeaking ? "Carl is speaking…" : "Carl · AI Interviewer"}</span>
            </div>
          </div>
          {/* Caption bar */}
          <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 px-6 py-5 text-center">
            <div className="bg-slate-800 rounded-2xl p-4 shadow-sm mb-3 max-w-lg mx-auto">
              <p className="text-white text-sm leading-relaxed italic">&ldquo;{welcomeMsg}&rdquo;</p>
            </div>
            <p className="text-slate-500 text-sm">
              {carlSpeaking ? "Carl is speaking…" : "Preparing your first question…"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <CarlAvatar size="lg" speaking={carlSpeaking} />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-4">
            <p className="text-slate-700 text-base leading-relaxed italic">
              &ldquo;{welcomeMsg}&rdquo;
            </p>
          </div>
          <p className="text-slate-500 text-sm">
            {carlSpeaking ? "Carl is speaking…" : "Preparing your first question…"}
          </p>
        </div>
      </div>
    );
  }

  // --- ANALYZING ---
  if (phase === "analyzing") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center ring-2 ring-indigo-500/30">
                <div className="w-8 h-8 border-3 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" style={{ borderWidth: "3px" }} />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Carl is analyzing your interview…</h1>
          <p className="text-slate-400 text-sm mb-6">
            This usually takes 15–30 seconds. Your responses are being scored and reviewed.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex items-start gap-3 text-left">
            <span className="text-amber-400 text-lg leading-none mt-0.5 flex-shrink-0">⚠</span>
            <p className="text-amber-200/80 text-sm leading-relaxed">
              <strong className="text-amber-300">Please don&apos;t close this tab</strong> — the analysis is still running. You can close it once you see the completion screen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- RESUME GATE (voice/video — user click unlocks browser autoplay) ---
  if (phase === "active" && needsResumeClick) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <CarlAvatar size="lg" />
          </div>
          <p className="text-indigo-300 font-semibold text-sm mb-1">Resuming your interview</p>
          <h1 className="text-2xl font-extrabold text-white mb-2">Welcome back, {firstName}</h1>
          <p className="text-slate-400 text-sm mb-3">
            Question {questionIndex + 1} of {questions.length}
          </p>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed italic px-4">
            &ldquo;{questions[questionIndex]}&rdquo;
          </p>
          <button
            onClick={handleResume}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            Resume Interview <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE · VIDEO ---
  if (phase === "active" && mode === "video") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800 flex-shrink-0">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/hiventra_icon.png" alt="Hiventra" className="w-6 h-6 rounded-md object-cover" />
            <span className="font-extrabold text-white text-sm hidden sm:block">Hiventra</span>
          </div>
          <span className="text-slate-300 text-sm font-semibold">
            Question {Math.min(questionIndex + 1, questions.length)} of {questions.length}
          </span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-mono">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Main: avatar left, controls right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Carl avatar panel */}
          <div className="relative lg:flex-1 h-[55vh] lg:h-auto bg-slate-950 overflow-hidden flex-shrink-0">
            {/* Simli video is appended here imperatively via useEffect */}
            <div ref={simliContainerRef} className="absolute inset-0" />

            {/* Fallback avatar while Simli connects */}
            {!simliConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3">
                <CarlAvatar size="lg" speaking={carlSpeaking} />
                <p className="text-slate-500 text-xs">
                  {SIMLI_API_KEY ? "Connecting avatar…" : "Configure NEXT_PUBLIC_SIMLI_API_KEY to enable avatar"}
                </p>
              </div>
            )}

            {/* Carl name label */}
            <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${carlSpeaking ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
              <span className="text-white text-xs font-medium">{carlLabel}</span>
            </div>

            {/* Candidate self-view PiP */}
            <div className="absolute bottom-3 right-3 z-10 w-28 h-20 rounded-xl overflow-hidden border-2 border-slate-600 bg-slate-800 shadow-lg">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {recording !== "recording" && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                  <Camera className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>
          </div>

          {/* Right panel: question + recording */}
          <div className="lg:w-96 flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 overflow-y-auto">
            <div className="flex-1 p-4 sm:p-5 flex flex-col gap-4">

              {/* Question bubble */}
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm min-h-[80px]">
                {isThinking ? (
                  <ThinkingDots />
                ) : carlAck ? (
                  <p className="text-slate-700 text-sm leading-relaxed italic">{carlAck}</p>
                ) : (
                  <p className="text-slate-900 text-sm font-medium leading-relaxed">{currentQ}</p>
                )}
              </div>

              {/* Recording controls — same UX as voice mode */}
              {!carlAck && !isThinking && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <Waveform active={recording === "recording"} />

                  {recording === "idle" && (
                    <>
                      {carlSpeaking ? (
                        <p className="text-indigo-300 text-sm text-center">Carl is speaking — recording starts automatically…</p>
                      ) : sttBlocked ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                          <p className="text-amber-400 text-sm font-medium">Speech recognition blocked</p>
                          <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                            Your browser is blocking the Web Speech API. Try <strong className="text-slate-400">Chrome / Edge</strong>, or disable &quot;Block fingerprinting&quot; in Brave.
                          </p>
                          <button onClick={() => { setSttBlocked(false); startRecording(); }} className="text-indigo-400 text-xs underline">
                            Try again
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-500 text-sm">Tap to start recording your answer</p>
                          <button
                            onClick={startRecording}
                            className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-colors"
                          >
                            <Mic className="w-5 h-5 text-white" />
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {recording === "recording" && (
                    <>
                      <p className="text-red-400 text-sm font-medium">Recording… {formatTime(recSeconds)}</p>
                      <button onClick={stopRecording} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 transition-colors">
                        <Square className="w-5 h-5 text-white" />
                      </button>
                      {transcript && <p className="text-slate-400 text-xs text-center max-w-xs italic">&ldquo;{transcript}&rdquo;</p>}
                    </>
                  )}

                  {recording === "transcribing" && (
                    <>
                      <p className="text-indigo-300 text-sm">Processing your answer…</p>
                      <div className="w-14 h-14 rounded-full bg-indigo-600/30 flex items-center justify-center ring-2 ring-indigo-400/30">
                        <div className="w-5 h-5 border-2 border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />
                      </div>
                    </>
                  )}

                  {recording === "recorded" && (
                    <>
                      <p className="text-emerald-400 text-sm font-medium">Answer transcribed — review before submitting</p>
                      {transcript ? (
                        <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3">
                          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Your answer</p>
                          <p className="text-white text-sm leading-relaxed">&ldquo;{transcript}&rdquo;</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs text-center">No transcription detected. Please re-record.</p>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setRecording("idle"); setAnswer(""); setTranscript(""); pendingVoiceAnswerRef.current = ""; }}
                          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm border border-slate-700 px-4 py-2 rounded-xl transition-colors"
                        >
                          <Mic className="w-4 h-4" /> Re-record
                        </button>
                        <button
                          onClick={() => { submitAndAdvanceRef.current?.(pendingVoiceAnswerRef.current); }}
                          disabled={isSubmitting || !transcript}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                        >
                          {isSubmitting ? "Submitting…" : "Submit"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Skip */}
            {!carlAck && !isThinking && (
              <div className="px-5 pb-4 text-center">
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-slate-500 hover:text-slate-400 text-xs transition-colors disabled:opacity-30"
                >
                  Skip this question
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE · TEXT / VOICE ---
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-slate-800 flex-shrink-0">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <span className="text-white font-extrabold text-xs">H</span>
          </div>
          <span className="font-extrabold text-white text-sm hidden sm:block">Hiventra</span>
        </div>
        <span className="text-slate-300 text-sm font-semibold">
          Question {Math.min(questionIndex + 1, questions.length)} of {questions.length}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm font-mono">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 min-h-full">
          {/* Carl bubble */}
          <div className="flex items-start gap-3">
            <CarlAvatar size="sm" speaking={carlSpeaking} />
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl rounded-tl-sm p-5 shadow-sm">
                {isThinking ? (
                  <ThinkingDots />
                ) : carlAck ? (
                  <p className="text-slate-700 text-base leading-relaxed italic">{carlAck}</p>
                ) : (
                  <p className="text-slate-900 text-base font-medium leading-relaxed">{currentQ}</p>
                )}
              </div>
              <p className="text-slate-600 text-xs mt-1.5 ml-1">{carlLabel}</p>
            </div>
          </div>

          {/* Response area — hidden during ack */}
          {!carlAck && !isThinking && (
            <div className="flex-1">
              {mode === "text" && (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                      }}
                      placeholder="Type your answer here…"
                      disabled={isSubmitting}
                      rows={6}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 text-sm leading-relaxed"
                    />
                    <span className="absolute bottom-3 right-4 text-slate-600 text-xs">
                      {answer.length > 0 ? `${answer.length} chars · ⌘↵ to submit` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSkip}
                      disabled={isSubmitting}
                      className="text-slate-500 hover:text-slate-400 text-xs transition-colors disabled:opacity-30"
                    >
                      Skip this question
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!answer.trim() || isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {isSubmitting ? "Submitting…" : "Submit Answer"}
                    </button>
                  </div>
                </div>
              )}

              {mode === "voice" && (
                <div className="flex flex-col items-center gap-5 py-6">
                  {browserWarning && (
                    <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                      <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-amber-300 text-xs font-semibold mb-0.5">Brave browser detected</p>
                        <p className="text-amber-200/70 text-xs leading-relaxed">
                          Brave blocks speech recognition by default. Click the <strong>Brave Shields icon</strong> (🦁) in the address bar, disable &quot;Block fingerprinting&quot; for this site, then refresh — or switch to <strong>Chrome / Edge</strong>.
                        </p>
                      </div>
                      <button onClick={() => setBrowserWarning(false)} className="text-amber-400/60 hover:text-amber-300 text-sm leading-none flex-shrink-0">✕</button>
                    </div>
                  )}
                  <Waveform active={recording === "recording"} />
                  {recording === "idle" && (
                    <>
                      {carlSpeaking ? (
                        <>
                          <p className="text-indigo-300 text-sm">Carl is speaking — recording will start automatically…</p>
                          <div className="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center ring-2 ring-indigo-400/30">
                            <div className="w-5 h-5 border-2 border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />
                          </div>
                        </>
                      ) : sttBlocked ? (
                        <div className="flex flex-col items-center gap-3 max-w-xs text-center">
                          <p className="text-amber-400 text-sm font-medium">Speech recognition blocked</p>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Your browser is blocking the Web Speech API. If you&apos;re using <strong className="text-slate-400">Brave</strong>, click the shield icon in the address bar and disable &quot;Block fingerprinting&quot; for this site, then refresh. Or switch to <strong className="text-slate-400">Chrome / Edge</strong>.
                          </p>
                          <button
                            onClick={() => { setSttBlocked(false); startRecording(); }}
                            className="text-indigo-400 text-xs underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-500 text-sm">Tap to start recording your answer</p>
                          <button
                            onClick={startRecording}
                            className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-colors"
                          >
                            <Mic className="w-6 h-6 text-white" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {recording === "recording" && (
                    <>
                      <p className="text-red-400 text-sm font-medium">Recording… {formatTime(recSeconds)}</p>
                      <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 transition-colors">
                        <Square className="w-6 h-6 text-white" />
                      </button>
                      {transcript && (
                        <p className="text-slate-400 text-xs text-center max-w-sm italic">"{transcript}"</p>
                      )}
                    </>
                  )}
                  {recording === "transcribing" && (
                    <>
                      <p className="text-indigo-300 text-sm">Processing your answer…</p>
                      <div className="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center ring-2 ring-indigo-400/30">
                        <div className="w-5 h-5 border-2 border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />
                      </div>
                    </>
                  )}
                  {recording === "recorded" && (
                    <>
                      <p className="text-emerald-400 text-sm font-medium">Answer transcribed — review before submitting</p>
                      {transcript ? (
                        <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-3">
                          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Transcribed answer</p>
                          <p className="text-white text-sm leading-relaxed">"{transcript}"</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs text-center max-w-sm">No transcription detected. Please re-record your answer.</p>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setRecording("idle"); setAnswer(""); setTranscript(""); pendingVoiceAnswerRef.current = ""; }}
                          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm border border-slate-700 px-4 py-2 rounded-xl transition-colors"
                        >
                          <Mic className="w-4 h-4" /> Re-record
                        </button>
                        <button
                          onClick={() => { submitAndAdvanceRef.current?.(pendingVoiceAnswerRef.current); }}
                          disabled={isSubmitting || !transcript}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold px-6 py-2 rounded-xl text-sm transition-colors"
                        >
                          {isSubmitting ? "Submitting…" : "Submit Answer"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
