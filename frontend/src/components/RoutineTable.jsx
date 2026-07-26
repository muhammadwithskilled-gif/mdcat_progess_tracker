export default function RoutineTable({ routine }) {
  return (
    <section className="card routine-card">
      <h2 className="card-title">Daily Routine (24-Hour Breakdown)</h2>
      <p className="card-subtitle">Your recurring template for each of the 20 days.</p>
      <div className="routine-table">
        {routine.map((row, i) => (
          <div className="routine-row" key={i}>
            <span className="routine-time">{row.time}</span>
            <span className="routine-activity">{row.activity}</span>
            <span className="routine-duration">{row.duration}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
