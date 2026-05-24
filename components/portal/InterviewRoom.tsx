"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, Camera, CheckCircle2, Clock, ChevronRight, Square } from "lucide-react";
import {
  startInterview,
  submitAnswer,
  completeInterview,
  type InterviewData,
} from "@/app/actions/interviews";

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
  const cls = { sm: "w-9 h-9 text-base", md: "w-14 h-14 text-xl", lg: "w-20 h-20 text-3xl" };
  return (
    <div className="relative flex-shrink-0">
      {speaking && <div className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping" />}
      <div className={`${cls[size]} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ${speaking ? "ring-indigo-400/70" : "ring-indigo-400/20"} relative z-10`}>
        <span className="font-extrabold text-white">C</span>
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
  // On refresh, browser autoplay is blocked until a user gesture — require a click to resume
  const [needsResumeClick, setNeedsResumeClick] = useState(
    () => phase === "active" && mode === "voice" && interview.status === "started"
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const confirmedTextRef = useRef(""); // finalized speech across SpeechRecognition restarts
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const pendingVoiceAnswerRef = useRef("");
  const questionIndexRef = useRef(questionIndex);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitAndAdvanceRef = useRef<((answer: string) => Promise<void>) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  // Keep refs in sync with latest render values so async callbacks never use stale closures
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

  useEffect(() => {
    if (phase !== "active") return;
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const handleResume = async () => {
    setNeedsResumeClick(false);
    await speakText(questions[questionIndex]);
    startRecordingRef.current?.();
  };

  const speakText = (text: string): Promise<void> => {
    if (mode !== "voice") return Promise.resolve();
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

      // Safety: unblock after 12s regardless of TTS state
      const safetyTimer = setTimeout(done, 12000);

      const controller = new AbortController();
      // Abort fetch after 11s (slightly under safety timer)
      const fetchTimer = setTimeout(() => controller.abort(), 11000);

      fetch("/api/tts", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then((blob) => {
          clearTimeout(fetchTimer);
          clearTimeout(safetyTimer);
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); done(); };
          audio.onerror = () => { URL.revokeObjectURL(url); done(); };
          audio.play().catch(() => {
            // Browser blocked autoplay — give a 2s reading window then continue
            URL.revokeObjectURL(url);
            setTimeout(done, 2000);
          });
        })
        .catch(() => {
        clearTimeout(fetchTimer);
        clearTimeout(safetyTimer);
        // TTS failed — hold for 3 s so the user can read the question before recording starts
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
    // completeInterview runs analysis server-side before returning
    await completeInterview(interview.id);
    setPhase("complete");
  };

  // Core submit logic — reads questionIndex from ref so async callbacks never use stale closures
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
      if (mode === "voice") await speakText(ack);
      else await new Promise((resolve) => setTimeout(resolve, 2800));
      setCarlAck(null);
    }

    if (isLast) {
      await doComplete();
      return;
    }

    const nextIdx = capturedIndex + 1;
    setQuestionIndex(nextIdx);
    if (mode === "voice") {
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
    if (mode === "voice") {
      await speakText(welcomeText);
    } else {
      await new Promise((r) => setTimeout(r, 4000));
    }

    setPhase("active");
    await speakText(finalQuestions[0]);
    if (mode === "voice") startRecording();
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

    // Video mode: also capture MediaRecorder stream for display
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

    // Web Speech API — primary transcription for voice and video modes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // Browser doesn't support Web Speech API at all
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

    // sessionBuffer accumulates finals within the current recognition session.
    // On silence-restart, it's seeded from confirmedTextRef so nothing is lost.
    let sessionBuffer = "";
    // Prevents infinite restart loop when a permanent error (e.g. service blocked) occurs
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
      setTranscript(transcriptRef.current);
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

    // Stop video MediaRecorder if running
    if (mediaRef.current) {
      try {
        mediaRef.current.stream.getTracks().forEach((t) => t.stop());
        if (mediaRef.current.state !== "inactive") mediaRef.current.stop();
      } catch { /* ignore */ }
      mediaRef.current = null;
    }

    setRecording("transcribing");

    if (!speechRef.current) {
      // No recognition running — use whatever was captured
      const text = confirmedTextRef.current || transcriptRef.current;
      pendingVoiceAnswerRef.current = text;
      setTranscript(text);
      setRecording("recorded");
      return;
    }

    const recognition = speechRef.current;
    speechRef.current = null;

    const finalizeTranscript = () => {
      const text = confirmedTextRef.current.trim();
      pendingVoiceAnswerRef.current = text;
      setTranscript(text);
      setRecording("recorded");
    };

    // Override onend: fires after stop() flushes any pending results
    recognition.onend = finalizeTranscript;

    try {
      recognition.stop(); // fires final onresult (if any) then onend
    } catch {
      // recognition was already inactive (e.g. stopped due to silence and not yet restarted)
      finalizeTranscript();
    }
  };

  const progress = questions.length ? (questionIndex / questions.length) * 100 : 0;
  const currentQ = questions[questionIndex] ?? "";

  // Bubble content: thinking → ack → question
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
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={phase === "starting"}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-wait text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
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

  // --- RESUME GATE (voice only — user click unlocks browser autoplay) ---
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

  // --- ACTIVE ---
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

              {mode === "video" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative bg-slate-800 rounded-2xl overflow-hidden w-full max-w-xs aspect-video border border-slate-700">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    {recording === "recording" && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600/90 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-white text-xs font-medium">{formatTime(recSeconds)}</span>
                      </div>
                    )}
                    {recording === "idle" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {recording === "idle" && (
                      <button onClick={startRecording} disabled={isThinking} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                        <Camera className="w-4 h-4" /> Start Recording
                      </button>
                    )}
                    {recording === "recording" && (
                      <button onClick={stopRecording} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                        <Square className="w-4 h-4" /> Stop
                      </button>
                    )}
                    {recording === "recorded" && (
                      <>
                        <button onClick={() => { setRecording("idle"); setAnswer(""); setTranscript(""); }} className="flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 px-4 py-2.5 rounded-xl text-sm transition-colors">
                          <Camera className="w-4 h-4" /> Re-record
                        </button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                          {isSubmitting ? "Submitting…" : "Submit Answer"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
