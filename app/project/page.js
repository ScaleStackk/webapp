export const metadata = {
  title: "Project Aim | QuestaCase",
  description: "The aim and real-world applications of the distributed information platform.",
};

const useCases = [
  ["Enterprise knowledge", "Detect similar projects, surface reusable work and reduce duplicated development across teams."],
  ["News intelligence", "Continuously ingest reports and connect developing events, organisations, people and locations."],
  ["Social media tracking", "Follow activity and emerging themes across high-volume, rapidly changing social streams."],
  ["Operational monitoring", "Combine logs, incidents and reports so teams can retrieve recent context during an event."],
  ["Research discovery", "Connect papers, experiments and prior findings before new investigation begins."],
  ["Legal research", "Relate judgments, holdings, cited authorities and legal principles with traceable evidence."],
];

export default function ProjectPage() {
  return (
    <main className="info-page">
      <section className="simple-hero">
        <span>Project aim</span>
        <h1>Distributed real-time information<br />ingestion and retrieval</h1>
        <p>Continuously capture changing information, process it through independently scalable services, and make both semantic meaning and explicit relationships immediately searchable.</p>
      </section>

      <section className="simple-section problem-grid">
        <article><span>01</span><h2>Information keeps arriving</h2><p>Documents, messages, feeds and events are produced faster than teams can organise them manually.</p></article>
        <article><span>02</span><h2>Context is fragmented</h2><p>Relevant facts may use different words or remain connected only through people, events and references.</p></article>
        <article><span>03</span><h2>Answers must stay current</h2><p>Retrieval should reflect newly ingested information while remaining traceable to its original evidence.</p></article>
      </section>

      <section className="simple-section use-case-section">
        <div className="simple-heading">
          <span>Example applications</span>
          <h2>One architecture, many live information domains</h2>
        </div>
        <div className="use-case-grid">
          {useCases.map(([name, description]) => (
            <article key={name}><strong>{name}</strong><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section className="simple-note">
        <strong>Current demonstration</strong>
        <p>QuestaCase demonstrates the architecture with Supreme Court judgments. A new judgment is stored, distributed to graph and embedding pipelines, indexed in both databases and made available for evidence-grounded retrieval. The legal domain is the test case—not the limit of the platform.</p>
      </section>
    </main>
  );
}
