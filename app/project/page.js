export const metadata = {
  title: "Project Rationale | QuestaCase",
  description: "The problem statement and design rationale behind QuestaCase.",
};

const choices = [
  ["S3", "Keeps every original judgment durable and recoverable."],
  ["Kafka", "Lets graph and embedding workers process the same upload independently."],
  ["Neo4j + Qdrant", "Combines explicit legal relationships with semantic passage search."],
  ["Small local models", "Keeps inference affordable while preserving privacy and control."],
];

export default function ProjectPage() {
  return (
    <main className="info-page">
      <section className="simple-hero">
        <span>Problem statement</span>
        <h1>Legal research is more than finding matching words.</h1>
        <p>Useful answers must connect judgments, holdings, authorities and statutory interpretation—and still point back to the source.</p>
      </section>

      <section className="simple-section problem-grid">
        <article><span>01</span><h2>Judgments are unstructured</h2><p>Important rules are buried inside facts, arguments, procedure and cited cases.</p></article>
        <article><span>02</span><h2>Meaning is connected</h2><p>A relevant precedent may use different words but address the same legal principle.</p></article>
        <article><span>03</span><h2>Evidence matters</h2><p>An AI answer is useful only when its claims remain traceable to judgment pages.</p></article>
      </section>

      <section className="simple-section choice-section">
        <div className="simple-heading">
          <span>Why this design</span>
          <h2>Simple components with clear jobs</h2>
        </div>
        <div className="choice-list">
          {choices.map(([name, reason]) => (
            <article key={name}><strong>{name}</strong><p>{reason}</p></article>
          ))}
        </div>
      </section>

      <section className="simple-note">
        <strong>Project focus</strong>
        <p>This is a distributed data-engineering project using pretrained models—not an attempt to train a new LLM.</p>
      </section>

    </main>
  );
}
