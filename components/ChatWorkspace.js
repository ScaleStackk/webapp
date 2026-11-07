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
  const resultEndRef = useRef(null);
  const selectedIds = judgments.map((judgment) => judgment.id);

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

  const submitQuestion = async (text = question) => {
    const trimmed = text.trim();
    if (!trimmed || sending || selectedIds.length === 0) return;

    const userMessage = {
      id: `message-${Date.now()}`,
      role: "user",
      content: trimmed,
      sources: [],
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setSending(true);

    try {
      const response = await askJudgments({
        question: trimmed,
        judgmentIds: selectedIds,
        judgments,
      });
      setMessages((current) => [...current, response]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `message-${Date.now()}`,
          role: "assistant",
          content: "I could not complete that search. Please try again.",
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const searchResults = messages.filter((message) => message.id !== "welcome");

  return (
    <main className="search-app">
      <header className="search-header">
        <button
          aria-label="QuestaCase home"
          className="questacase-brand"
          onClick={() => {
            setMessages(STARTER_MESSAGES);
            setQuestion("");
          }}
          type="button"
        >
          <span className="questacase-icon"><Icon name="scales" size={21} /></span>
          <span>Questa<span>Case</span></span>
        </button>

        <div className="search-header-actions">
          <button className="corner-upload" onClick={() => setUploadOpen(true)} type="button">
            <Icon name="upload" size={17} /> <span>Upload judgment</span>
          </button>
        </div>
      </header>

      <section className="search-stage">
        <div className="search-orb search-orb-one" />
        <div className="search-orb search-orb-two" />
        <div className="search-home">
          <span className="search-eyebrow"><Icon name="sparkle" size={14} /> Evidence-grounded legal research</span>

          <form
            className={`legal-search ${selectedIds.length === 0 ? "is-disabled" : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              submitQuestion();
            }}
          >
            <span
              aria-live="polite"
              className={`backend-status is-${backendStatus}`}
              title={`Backend ${backendStatus}`}
            >
              <span className="backend-status-dot" />
              <span>Backend {backendStatus}</span>
            </span>
            <div className="search-input-shell">
              <Icon name="search" size={23} />
              <input
                aria-label="Search selected judgments"
                autoComplete="off"
                disabled={selectedIds.length === 0}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={selectedIds.length ? "Ask a question about the law or the judgments…" : "Upload a judgment to search"}
                type="search"
                value={question}
              />
            </div>
            <button className="search-submit" disabled={!question.trim() || sending || selectedIds.length === 0} type="submit">
              <Icon name="search" size={17} /> Search
            </button>
          </form>

        </div>
      </section>

      {(searchResults.length > 0 || sending) && (
        <section className="search-results" aria-live="polite">
          <div className="results-heading">
            <span>Research results</span>
            <button onClick={() => setMessages(STARTER_MESSAGES)} type="button">Clear results</button>
          </div>

          <div className="result-stream">
            {searchResults.map((message) =>
              message.role === "user" ? (
                <article className="result-query" key={message.id}>
                  <span><Icon name="search" size={18} /></span>
                  <h2>{message.content}</h2>
                </article>
              ) : (
                <article className={`answer-result ${message.error ? "has-error" : ""}`} key={message.id}>
                  <div className="answer-label"><span><Icon name="scales" size={15} /></span> Answer</div>
                  <p>{message.content}</p>
                  {message.sources?.length > 0 && (
                    <div className="result-sources">
                      <span>Sources</span>
                      {message.sources.map((source) => (
                        <button className="result-source" key={`${source.judgment}-${source.location}`} type="button">
                          <Icon name="file" size={16} />
                          <span><strong>{source.judgment}</strong><small>{source.location}</small></span>
                          <Icon name="chevron" size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                  {message.isMock && <small className="result-demo-label">Demonstration response</small>}
                </article>
              ),
            )}

            {sending && (
              <article className="answer-result is-loading">
                <div className="answer-label"><span><Icon name="scales" size={15} /></span> Searching judgments</div>
                <div className="search-loading"><span /><span /><span /></div>
              </article>
            )}
            <div ref={resultEndRef} />
          </div>
        </section>
      )}

      <footer className="search-footer">
        Legal Research Assistant
      </footer>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />

      {toast && (
        <div className="app-toast" role="status">
          <span><Icon name="check" size={15} /></span>{toast}
        </div>
      )}
    </main>
  );
}
