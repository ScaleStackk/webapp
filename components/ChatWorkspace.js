"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_URL, backendEndpoint } from "../lib/apiConfig";
import { askJudgments, uploadJudgment } from "../lib/mockApi";
import { Icon } from "./Icons";
import UploadModal from "./UploadModal";

const DEMO_JUDGMENT = {
  id: "demo-judgment",
  name: "A.K.T.K.M. Vishnudatta Andharjanam v. Commissioner",
  filename: "Vishnudatta_Andharjanam_v_Commissioner.pdf",
  status: "ready",
  pages: 4,
  addedAt: "2026-10-22T09:30:00.000Z",
  demo: true,
};

const STARTER_MESSAGES = [
  {
    id: "welcome",
    role: "assistant",
    content: "Search your judgment library to begin.",
    sources: [],
  },
];

export default function ChatWorkspace() {
  const [judgments, setJudgments] = useState([DEMO_JUDGMENT]);
  const [messages, setMessages] = useState(STARTER_MESSAGES);
  const [question, setQuestion] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [retrieval, setRetrieval] = useState({ vector: true, graph: true });
  const inputRef = useRef(null);
  const requestAbortRef = useRef(null);
  const requestIdRef = useRef(0);
  const resultEndRef = useRef(null);
  const canSearch = judgments.length > 0;

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    if (parameters.get("upload") === "true") {
      setUploadOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      if (!BACKEND_URL) {
        setBackendStatus("disconnected");
        return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(backendEndpoint("health"), {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = response.ok ? await response.json() : null;
        setBackendStatus(payload?.status === "ok" ? "connected" : "disconnected");
      } catch {
        setBackendStatus("disconnected");
      } finally {
        window.clearTimeout(timeout);
      }
    };

    checkBackend();
    const interval = window.setInterval(checkBackend, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("lexora-judgments");
    if (!stored) return;
    try {
      const uploaded = JSON.parse(stored);
      if (Array.isArray(uploaded) && uploaded.length) {
        setJudgments([DEMO_JUDGMENT, ...uploaded]);
      }
    } catch {
      window.localStorage.removeItem("lexora-judgments");
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1 || sending) {
      resultEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, sending]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleUpload = async (file, onProgress) => {
    const judgment = await uploadJudgment(file, onProgress);
    const nextUploaded = [judgment, ...judgments.filter((item) => !item.demo)];
    window.localStorage.setItem("lexora-judgments", JSON.stringify(nextUploaded));
    setJudgments((current) => [judgment, ...current]);
    setToast("Judgment uploaded and queued for processing");
  };

  const toggleRetrieval = (name) => {
    setRetrieval((current) => {
      const other = name === "vector" ? "graph" : "vector";
      if (current[name] && !current[other]) return current;
      return { ...current, [name]: !current[name] };
    });
  };

  const submitQuestion = async (text = question) => {
    const trimmed = text.trim();
    if (!trimmed || sending || !canSearch || backendStatus !== "connected") return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    requestAbortRef.current = controller;

    setMessages(STARTER_MESSAGES);
    setQuestion(trimmed);
    setSending(true);

    try {
      const response = await askJudgments({
        question: trimmed,
        judgmentIds: [],
        retrieval,
        judgments,
        signal: controller.signal,
      });
      if (requestIdRef.current === requestId) {
        setMessages([STARTER_MESSAGES[0], response]);
      }
    } catch (error) {
      if (error?.name !== "AbortError" && requestIdRef.current === requestId) {
        setMessages([
          STARTER_MESSAGES[0],
          {
            id: `message-${Date.now()}`,
            role: "assistant",
            content: "I could not complete that search. Please try again.",
            sources: [],
            error: true,
          },
        ]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        requestAbortRef.current = null;
        setSending(false);
      }
    }
  };

  const resetSearch = () => {
    requestIdRef.current += 1;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    setSending(false);
    setMessages(STARTER_MESSAGES);
    setQuestion("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const searchResults = messages.filter((message) => message.role === "assistant" && message.id !== "welcome");
  const hasResponse = searchResults.length > 0;
  const searchLocked = sending || hasResponse;

  return (
    <main className="search-app">
      <section className="search-stage">
        <div className="search-orb search-orb-one" />
        <div className="search-orb search-orb-two" />
        <div className="search-home">
          <form
            className={`legal-search ${!canSearch || searchLocked ? "is-disabled" : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              submitQuestion();
            }}
          >
            <div className="retrieval-controls" role="group" aria-label="Query evidence sources">
              <span>Use</span>
              <button
                aria-pressed={retrieval.vector}
                disabled={searchLocked || (retrieval.vector && !retrieval.graph)}
                onClick={() => toggleRetrieval("vector")}
                type="button"
              >
                <span className="retrieval-switch" aria-hidden="true"><span /></span>
                Embeddings
              </button>
              <button
                aria-pressed={retrieval.graph}
                disabled={searchLocked || (retrieval.graph && !retrieval.vector)}
                onClick={() => toggleRetrieval("graph")}
                type="button"
              >
                <span className="retrieval-switch" aria-hidden="true"><span /></span>
                Knowledge graph
              </button>
            </div>
            <div className="search-input-shell">
              <Icon name="search" size={23} />
              <input
                aria-label="Search selected judgments"
                autoComplete="off"
                disabled={!canSearch || searchLocked}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={canSearch ? "Ask a question about the law or the judgments…" : "Upload a judgment to search"}
                ref={inputRef}
                type="search"
                value={question}
              />
            </div>
            {!hasResponse && (
              sending ? (
                <button className="search-submit is-cancel" onClick={resetSearch} type="button">
                  <Icon name="close" size={17} /> Cancel
                </button>
              ) : (
                <button
                  className="search-submit"
                  disabled={backendStatus !== "connected" || !question.trim() || !canSearch}
                  type="submit"
                >
                  {backendStatus === "connected" ? (
                    <><Icon name="search" size={17} /> Search</>
                  ) : "Backend Disconnected"}
                </button>
              )
            )}
            {sending && (
              <div className="inline-search-status" role="status">
                <span>Finding the answer…</span>
                <div className="search-loading" aria-hidden="true"><span /><span /><span /></div>
              </div>
            )}

            {searchResults.map((message, index) => (
              <article className={`inline-answer-box ${message.error ? "has-error" : ""}`} key={message.id} aria-live="polite">
                <div className="answer-label"><span><Icon name="scales" size={15} /></span> Answer</div>
                <p>{message.content}</p>
                {message.sources?.length > 0 && (
                  <div className="result-sources">
                    <span>Sources</span>
                    {message.sources.map((source, sourceIndex) => (
                      <button
                        className="result-source"
                        key={source.chunkId || `${source.documentId || source.judgment}-${source.location}-${sourceIndex}`}
                        type="button"
                      >
                        <Icon name="file" size={16} />
                        <span><strong>{source.judgment}</strong><small>{source.location}</small></span>
                        <Icon name="chevron" size={14} />
                      </button>
                    ))}
                  </div>
                )}
                {message.isMock && <small className="result-demo-label">Demonstration response</small>}
                {index === searchResults.length - 1 && (
                  <button className="answer-done" onClick={resetSearch} type="button">
                    <Icon name="check" size={16} /> Done
                  </button>
                )}
              </article>
            ))}
            <div ref={resultEndRef} />
          </form>

        </div>
      </section>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />

      {toast && (
        <div className="app-toast" role="status">
          <span><Icon name="check" size={15} /></span>{toast}
        </div>
      )}
    </main>
  );
}
