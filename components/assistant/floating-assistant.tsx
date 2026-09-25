"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Bot,
  GripVertical,
  LoaderCircle,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { askInventoryAssistant, type AssistantReply } from "@/app/actions/assistant";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  mode?: AssistantReply["mode"];
};

type Position = { x: number; y: number };

type SpeechResult = {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
};

type SpeechResultList = {
  readonly length: number;
  readonly [index: number]: SpeechResult;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: SpeechResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const BUTTON_SIZE = 56;
const EDGE_GAP = 12;
const POSITION_KEY = "stockflow-assistant-position";

const welcomeMessage: Message = {
  id: "floating-welcome",
  role: "assistant",
  text: "Hello! Ask me about your inventory or how to use StockFlow. You can type, choose a category, or speak your question.",
};

const categories = [
  { label: "Stock health", question: "Give me an inventory health summary" },
  { label: "Reordering", question: "What should I reorder next?" },
  { label: "Valuation", question: "What is my inventory worth?" },
  { label: "Suppliers", question: "Summarize my supplier situation" },
  { label: "Movements", question: "Summarize recent stock movements" },
  { label: "How to use", question: "How do I add a product and record stock?" },
  { label: "Security & 2FA", question: "How do I enable two-factor authentication?" },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function keepLauncherOnScreen(position: Position) {
  return {
    x: clamp(position.x, 8, window.innerWidth - BUTTON_SIZE - 8),
    y: clamp(position.y, 8, window.innerHeight - BUTTON_SIZE - 8),
  };
}

function speechRecognitionConstructor() {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [position, setPosition] = useState<Position | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [listening, setListening] = useState(false);
  const [requestingMicrophone, setRequestingMicrophone] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setPosition((current) => current ? keepLauncherOnScreen(current) : {
        x: window.innerWidth - BUTTON_SIZE - 20,
        y: window.innerHeight - BUTTON_SIZE - 20,
      });
    };

    const initialize = () => {
      const saved = window.localStorage.getItem(POSITION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Position;
          if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
            setPosition(keepLauncherOnScreen(parsed));
          }
        } catch {
          window.localStorage.removeItem(POSITION_KEY);
        }
      }
      updateViewport();
    };

    const animationFrame = window.requestAnimationFrame(initialize);
    window.addEventListener("resize", updateViewport);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateViewport);
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pending]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (!maximized) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMaximized(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [maximized]);

  function submit(value: string) {
    const clean = value.trim();
    if (clean.length < 2 || pending) return;
    setQuestion("");
    setVoiceMessage(null);
    setMessages((current) => [...current, {
      id: crypto.randomUUID(),
      role: "user",
      text: clean,
    }]);
    startTransition(async () => {
      const reply = await askInventoryAssistant(clean);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply.answer,
        mode: reply.mode,
      }]);
      inputRef.current?.focus();
    });
  }

  async function startVoiceQuery() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (requestingMicrophone) return;

    const Recognition = speechRecognitionConstructor();
    if (!Recognition) {
      setVoiceMessage("Voice transcription is not supported by this browser. Use Chrome or Edge, or type your question.");
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setVoiceMessage("Microphone access requires HTTPS or localhost in a supported browser. You can still type your question.");
      return;
    }

    setRequestingMicrophone(true);
    setVoiceMessage("Waiting for microphone permission… choose Allow in the browser popup.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : "";
      setRequestingMicrophone(false);
      setVoiceMessage(errorName === "NotAllowedError"
        ? "Microphone access is blocked. At the top of Chrome, click the info icon immediately before the website address. Then choose Site settings → Microphone → Allow, reload the page, and try again."
        : "The microphone could not be opened. Check that it is connected and not being used by another application.");
      return;
    }
    setRequestingMicrophone(false);

    let latestTranscript = "";
    let failed = false;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      latestTranscript = transcript.trim();
      setQuestion(latestTranscript);
      setVoiceMessage("Listening… your question will be sent when you stop speaking.");
    };
    recognition.onerror = (event) => {
      failed = true;
      const messagesByError: Record<string, string> = {
        "not-allowed": "Microphone access is blocked. At the top of Chrome, click the info icon immediately before the website address. Then choose Site settings → Microphone → Allow, reload the page, and try again.",
        "no-speech": "I couldn’t hear a question. Try again or type it instead.",
        network: "Voice transcription could not connect. Check your network or type the question.",
      };
      setVoiceMessage(messagesByError[event.error] ?? "Voice transcription failed. Please try again or type your question.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      if (!failed && latestTranscript.length >= 2) submit(latestTranscript);
    };

    recognitionRef.current = recognition;
    setVoiceMessage("Listening… speak your StockFlow question.");
    setListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceMessage("The microphone is already busy. Wait a moment and try again.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(question);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) drag.moved = true;
    if (drag.moved) setPosition(keepLauncherOnScreen({ x: drag.originX + deltaX, y: drag.originY + deltaY }));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    if (drag.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      const finalPosition = keepLauncherOnScreen({ x: rect.left, y: rect.top });
      setPosition(finalPosition);
      window.localStorage.setItem(POSITION_KEY, JSON.stringify(finalPosition));
    }
  }

  function handleLauncherClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setOpen((current) => !current);
  }

  function clearConversation() {
    setMessages([welcomeMessage]);
    setQuestion("");
    setVoiceMessage(null);
  }

  function closeAssistant() {
    setMaximized(false);
    setOpen(false);
  }

  const launcherStyle: CSSProperties = position
    ? { left: position.x, top: position.y }
    : { right: 20, bottom: 20 };

  let panelStyle: CSSProperties = { right: 20, bottom: 88, width: 400, height: 580 };
  if (viewport.width && viewport.height && position) {
    const width = Math.min(400, viewport.width - EDGE_GAP * 2);
    const availableAbove = position.y - EDGE_GAP * 2;
    const availableBelow = viewport.height - position.y - BUTTON_SIZE - EDGE_GAP * 2;
    const placeAbove = availableAbove >= availableBelow;
    const availableHeight = Math.max(placeAbove ? availableAbove : availableBelow, 260);
    const height = Math.min(580, availableHeight, viewport.height - EDGE_GAP * 2);
    const left = clamp(position.x + BUTTON_SIZE - width, EDGE_GAP, viewport.width - width - EDGE_GAP);
    const preferredTop = placeAbove
      ? position.y - height - EDGE_GAP
      : position.y + BUTTON_SIZE + EDGE_GAP;
    panelStyle = {
      left,
      top: clamp(preferredTop, EDGE_GAP, viewport.height - height - EDGE_GAP),
      width,
      height,
    };
  }

  return (
    <>
      {open && (
        <>
          {maximized && <div className="fixed inset-0 z-[65] bg-black/45 backdrop-blur-sm" aria-hidden="true" />}
          <section
            id="stockflow-assistant-dialog"
            role="dialog"
            aria-modal={maximized || undefined}
            aria-label="StockFlow AI assistant"
            className={`fixed flex overflow-hidden border bg-white shadow-2xl shadow-black/20 ${maximized ? "inset-0 z-[70] rounded-none sm:inset-4 sm:rounded-2xl" : "z-50 rounded-2xl"}`}
            style={maximized ? undefined : panelStyle}
          >
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-3 bg-[#14281d] px-4 py-3 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-[#dfff7a] text-[#17211b]">
                  <Bot className="size-5" />
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#14281d] bg-emerald-400" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-extrabold">Ask StockFlow</h2>
                  <p className="truncate text-[11px] text-white/65">AI-assisted · read-only · workspace scoped</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={clearConversation} className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Clear conversation" title="Clear conversation">
                  <RotateCcw className="size-4" />
                </button>
                <button type="button" onClick={() => setMaximized((current) => !current)} className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label={maximized ? "Restore compact assistant" : "Maximize assistant"} title={maximized ? "Restore compact view" : "Maximize to full screen"}>
                  {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
                <button type="button" onClick={closeAssistant} className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close assistant">
                  <X className="size-4" />
                </button>
              </div>
            </header>

            <div className="border-b bg-[#f8faf8] px-3 py-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#68736c]">
                <Sparkles className="size-3.5 text-[#176b45]" /> Query categories
              </div>
              <div className={`grid gap-1.5 ${maximized ? "grid-cols-2 sm:grid-cols-4 xl:grid-cols-7" : "grid-cols-2"}`}>
                {categories.map((category) => (
                  <button
                    key={category.label}
                    type="button"
                    disabled={pending}
                    onClick={() => submit(category.question)}
                    className="truncate rounded-lg border bg-white px-2.5 py-2 text-left text-xs font-bold text-[#425047] hover:border-[#176b45] hover:text-[#176b45] disabled:opacity-50"
                    title={category.question}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-4 ${maximized ? "sm:px-[10%] lg:px-[18%]" : ""}`} aria-live="polite" aria-busy={pending}>
              {messages.map((message) => (
                <div key={message.id} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green-50 text-green-700"><Bot className="size-3.5" /></span>}
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${message.role === "user" ? "rounded-br-sm bg-[#176b45] text-white" : "rounded-bl-sm bg-[#eff3ef] text-[#263029]"}`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    {message.role === "assistant" && /2fa|two-factor/i.test(message.text) && <Link href="/dashboard/settings" className="mt-2 inline-flex rounded-lg bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#176b45] shadow-sm ring-1 ring-[#cfe0d4] hover:bg-green-50">Open Settings →</Link>}
                    {message.mode && <p className="mt-1.5 text-[9px] font-extrabold uppercase tracking-wider opacity-55">{message.mode === "openai" ? "OpenAI enhanced" : "Verified StockFlow answer"}</p>}
                  </div>
                  {message.role === "user" && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#17211b] text-white"><UserRound className="size-3.5" /></span>}
                </div>
              ))}
              {pending && <div className="flex items-center gap-2 text-xs font-semibold text-[#68736c]"><LoaderCircle className="size-4 animate-spin" />Analyzing your workspace…</div>}
              <div ref={messagesEndRef} />
            </div>

            {voiceMessage && <p role="status" className={`border-t px-4 py-2 text-xs ${listening ? "bg-red-50 font-semibold text-red-800" : "bg-amber-50 text-amber-900"}`}>{voiceMessage}</p>}

            <form onSubmit={handleSubmit} className="border-t bg-white p-3">
              <div className={`flex items-center gap-2 ${maximized ? "mx-auto max-w-5xl" : ""}`}>
                <button
                  type="button"
                  onClick={startVoiceQuery}
                  disabled={pending || requestingMicrophone}
                  aria-pressed={listening}
                  aria-label={requestingMicrophone ? "Waiting for microphone permission" : listening ? "Stop listening and send question" : "Ask by voice"}
                  title={listening ? "Stop and send" : "Speak your question"}
                  className={`grid size-11 shrink-0 place-items-center rounded-xl border ${listening ? "border-red-300 bg-red-50 text-red-700" : "bg-white text-[#176b45] hover:border-[#176b45]"}`}
                >
                  {requestingMicrophone ? <LoaderCircle className="size-4 animate-spin" /> : listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Ask the StockFlow assistant</span>
                  <input
                    ref={inputRef}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    className="input"
                    minLength={2}
                    maxLength={300}
                    required
                    placeholder="Type or speak a question…"
                    autoComplete="off"
                  />
                </label>
                <button type="submit" disabled={pending || question.trim().length < 2} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#176b45] text-white disabled:opacity-45" aria-label="Send question">
                  <Send className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-[#7b867e]">Microphone audio is transcribed by your browser. The assistant cannot change inventory.</p>
            </form>
          </div>
          </section>
        </>
      )}

      {!maximized && <button
        type="button"
        className="fixed z-[60] grid size-14 touch-none select-none place-items-center rounded-2xl bg-[#14281d] text-white shadow-xl shadow-black/25 ring-4 ring-white transition-transform hover:scale-105 active:scale-95"
        style={launcherStyle}
        aria-label={open ? "Close StockFlow assistant. Drag to move." : "Open StockFlow assistant. Drag to move."}
        aria-controls="stockflow-assistant-dialog"
        aria-expanded={open}
        title="Click to ask StockFlow · drag to move"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragRef.current = null; }}
        onClick={handleLauncherClick}
      >
        {open ? <X className="size-5" /> : <Bot className="size-5" />}
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-white/35" aria-hidden="true"><GripVertical className="size-3" /></span>
        {!open && <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[#9bd63b]" />}
      </button>}
    </>
  );
}
