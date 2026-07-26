import StatusToggle from "./StatusToggle.jsx";

export default function TopicRow({ topic, status, onChange, savingId }) {
  const isSaving = savingId === topic.id;
  return (
    <li className={`topic-row status-${status}`}>
      <div className="topic-main">
        <span className="topic-dot" aria-hidden="true" />
        <div className="topic-text">
          <p className="topic-name">{topic.name}</p>
          <ul className="topic-outcomes">
            {topic.outcomes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="topic-action">
        {isSaving && <span className="saving-dot" title="Saving…" />}
        <StatusToggle status={status} onChange={(s) => onChange(topic.id, s)} disabled={isSaving} />
      </div>
    </li>
  );
}
