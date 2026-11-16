export const metadata = {
  title: "System Design | QuestaCase",
  description: "Architecture and design considerations of the distributed information platform.",
};

const considerations = [
  ["Single responsibility", "Each service performs one job: queueing, graph extraction, embedding, storage, retrieval or generation."],
  ["Asynchronous fan-out", "Kafka gives KG and embedding workers the same document through independent consumer groups."],
  ["Independent scaling", "Worker replicas can be added only where backlog or processing cost requires more capacity."],
  ["Parallel inference", "HAProxy distributes generation across interchangeable LLM nodes used by KG workers and the Inference API."],
  ["Dual retrieval", "Neo4j preserves explicit relationships while Qdrant finds semantically similar passages."],
  ["Failure isolation", "A slow worker or inference node does not require the upload, storage or other processing path to stop."],
];

export default function ArchitecturePage() {
  return (
    <main className="info-page design-page">
      <section className="simple-section design-canvas">
        <header className="design-page-heading">
          <span>System design</span>
          <h1>A modular architecture designed for independent scaling</h1>
          <p>Separate ingestion, processing, storage, retrieval and inference into focused services while preserving a clear, resilient flow from incoming data to grounded answers.</p>
        </header>
        <div className="system-layout" aria-label="Distributed system architecture">
          <div className="processing-block">
            <article className="system-entry">
              <span>Input layer</span><strong>Data</strong><small>PDFs, messages, feeds and other unstructured information</small>
            </article>

            <div className="flow-down">↓</div>

            <article className="system-entry api-entry">
              <span>Ingestion layer</span><strong>Upload API</strong><small>Stores incoming data and publishes a processing event</small>
            </article>

            <div className="flow-down">↓</div>

            <div className="ingestion-row">
              <article><span>Object storage</span><strong>Amazon S3</strong><small>Original PDFs</small></article>
              <article className="kafka-card"><span>Message broker</span><strong>Kafka</strong><small>Document events fan out to both worker groups</small></article>
            </div>

            <div className="source-worker-arrows" role="img" aria-label="S3 and Kafka each connect to the embedding and knowledge graph workers">
              <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 1000 150">
                <defs>
                  <marker id="worker-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
                    <path d="M0,0 L7,3.5 L0,7 Z" />
                  </marker>
                </defs>
                <path d="M205 0 V105 H120 V144" markerEnd="url(#worker-arrow)" />
                <path d="M295 0 V34 H810 V144" markerEnd="url(#worker-arrow)" />
                <path d="M705 0 V68 H190 V144" markerEnd="url(#worker-arrow)" />
                <path d="M795 0 V105 H880 V144" markerEnd="url(#worker-arrow)" />
              </svg>
            </div>

            <div className="worker-database-layer">
              <article className="worker-card edge-worker">
                <span>Scalable compute</span><strong>Embedding workers × N</strong><small>Fetch PDF · run BGE · write →</small>
              </article>
              <article className="database-card"><span>Vector database</span><strong>Qdrant</strong><small>Semantic passages</small></article>
              <article className="database-card"><span>Graph database</span><strong>Neo4j</strong><small>Connected knowledge</small></article>
              <article className="worker-card edge-worker">
                <span>Scalable compute</span><strong>KG workers × N</strong><small>← write graph · fetch PDF · extract</small>
              </article>
            </div>

            <div className="flow-up">↑</div>

            <article className="system-entry inference-api-entry">
              <span>Retrieval and generation layer</span><strong>Inference API</strong><small>Searches Neo4j and Qdrant in parallel, then sends grounded evidence to an LLM</small>
            </article>

            <div className="flow-up">↑</div>

            <article className="retrieval-strip">
              <span>Output layer</span><strong>Query</strong><small>Graph-only, vector-only or combined answers with supporting sources.</small>
            </article>
          </div>

          <div className="cluster-links" role="img" aria-label="KG workers and the Inference API connect to HAProxy">
            <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 1000">
              <defs>
                <marker id="proxy-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
                  <path d="M0,0 L7,3.5 L0,7 Z" />
                </marker>
              </defs>
              <path d="M0 600 H96" markerEnd="url(#proxy-arrow)" />
              <path d="M0 758 H96" markerEnd="url(#proxy-arrow)" />
              <text x="47" y="576">
                <tspan x="47">KG</tspan>
                <tspan className="connector-label-detail" x="47" dy="12">inference</tspan>
              </text>
              <text x="47" y="734">
                <tspan x="47">Query</tspan>
                <tspan className="connector-label-detail" x="47" dy="12">inference</tspan>
              </text>
            </svg>
          </div>

          <aside className="inference-side">
            <span>Parallel inference cluster</span>
            <div className="inference-stack">
              <div className="haproxy-bar"><strong>HAProxy</strong><small>Gateway</small></div>
              <div className="inference-side-nodes">
                <div>LLM node 1</div><div>LLM node 2</div><div>LLM node 3</div><div>+ N nodes</div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="simple-section consideration-section">
        <div className="simple-heading">
          <span>Design considerations</span>
          <h2>Why the system is separated this way</h2>
        </div>
        <div className="consideration-grid">
          {considerations.map(([name, explanation], index) => (
            <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong><p>{explanation}</p></article>
          ))}
        </div>
      </section>

      <section className="simple-note">
        <strong>Current phase</strong>
        <p>Compute scales horizontally while Neo4j and Qdrant remain single durable services for the demonstration. Storage replication and partitioning are intentionally deferred.</p>
      </section>
    </main>
  );
}
