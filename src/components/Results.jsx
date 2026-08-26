import React from "react";

function Results({ result }) {
  const {
    processes,
    averages,
    cpuUtilization,
    throughput,
    contextSwitches,
  } = result;

  return (
    <section className="card" id="results">
      <div className="section-title">
        <div>
          <h2>Performance Analysis</h2>
          <p>Scheduling metrics and process breakdown table.</p>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>Average Waiting Time</span>
          <strong>{averages.waiting.toFixed(2)}</strong>
          <small>time units</small>
        </div>

        <div className="metric">
          <span>Average Turnaround Time</span>
          <strong>{averages.turnaround.toFixed(2)}</strong>
          <small>time units</small>
        </div>

        <div className="metric">
          <span>Average Response Time</span>
          <strong>{averages.response.toFixed(2)}</strong>
          <small>time units</small>
        </div>

        <div className="metric">
          <span>CPU Utilization</span>
          <strong>{cpuUtilization.toFixed(2)}%</strong>
          <small>active CPU ratio</small>
        </div>

        <div className="metric">
          <span>Throughput</span>
          <strong>{throughput.toFixed(3)}</strong>
          <small>processes / time unit</small>
        </div>

        <div className="metric">
          <span>Context Switches</span>
          <strong>{contextSwitches}</strong>
          <small>switches</small>
        </div>
      </div>

      <div className="table-wrapper result-table">
        <table>
          <thead>
            <tr>
              <th>PID</th>
              <th>Arrival Time (AT)</th>
              <th>Burst Time (BT)</th>
              <th>Priority</th>
              <th>Completion Time (CT)</th>
              <th>Turnaround Time (TAT)</th>
              <th>Waiting Time (WT)</th>
              <th>Response Time (RT)</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.id}</strong>
                </td>
                <td>{p.arrival}</td>
                <td>{p.burst}</td>
                <td>{p.priority}</td>
                <td>{p.completion}</td>
                <td>{p.turnaround}</td>
                <td>{p.waiting}</td>
                <td>{p.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="formula-box">
        <h3>Formulas Applied</h3>
        <p>
          <strong>Turnaround Time (TAT):</strong> Completion Time (CT) − Arrival Time (AT)
        </p>
        <p>
          <strong>Waiting Time (WT):</strong> Turnaround Time (TAT) − Burst Time (BT)
        </p>
        <p>
          <strong>Response Time (RT):</strong> First CPU Start Time − Arrival Time (AT)
        </p>
      </div>
    </section>
  );
}

export default Results;