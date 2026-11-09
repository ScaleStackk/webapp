export const metadata = {
  title: "System Design | QuestaCase",
  description: "Architecture of the distributed legal GraphRAG system.",
};

export default function ArchitecturePage() {
  return (
    <main className="info-page">
      <section className="simple-hero">
        <span>System design</span>
        <h1>Two retrieval paths.<br />One grounded answer.</h1>
        <p>Judgments are processed as both connected legal knowledge and searchable text.</p>
      </section>

      <section className="simple-section">
        <div className="simple-flow" aria-label="System processing flow">
          <article><span>1</span><strong>Web app</strong><small>Upload or ask a question</small></article>
          <i>→</i>
          <article><span>2</span><strong>S3 + Kafka</strong><small>Store PDFs and distribute work</small></article>
          <i>→</i>
          <div className="flow-branches">
            <article><span>3A</span><strong>KG worker</strong><small>Qwen → Neo4j</small></article>
            <article><span>3B</span><strong>Embedding worker</strong><small>BGE → Qdrant</small></article>
          </div>
          <i>→</i>
          <article className="flow-answer"><span>4</span><strong>Qwen answer</strong><small>Combined evidence + citations</small></article>
        </div>
      </section>

      <section className="simple-section simple-explanation">
        <article>
          <span>When a judgment is uploaded</span>
          <h2>Process asynchronously</h2>
          <p>S3 keeps the original PDF. Kafka sends its document ID to separate graph and embedding workers, so both indexes update independently.</p>
        </article>
        <article>
          <span>When a question is asked</span>
          <h2>Retrieve in parallel</h2>
          <p>The API searches Neo4j for legal relationships and Qdrant for relevant passages, then asks Qwen to synthesize only the retrieved evidence.</p>
        </article>
      </section>

      <section className="simple-note">
        <strong>Current phase</strong>
        <p>Distributed processing with one Neo4j service and one Qdrant service. Partitioned storage is reserved for a later phase.</p>
      </section>

    </main>
  );
}
