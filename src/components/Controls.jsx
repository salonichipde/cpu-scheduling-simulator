import React from "react";

function Controls({
  algorithm,
  setAlgorithm,
  quantum,
  setQuantum,
  simulate,
}) {
  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Scheduling Algorithm</h2>
          <p>Select an algorithm and run the simulation.</p>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Algorithm</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
          >
            <option value="FCFS">FCFS</option>
            <option value="SJF">SJF - Non Preemptive</option>
            <option value="SRTF">SRTF - Preemptive SJF</option>
            <option value="PRIORITY">Priority - Non Preemptive</option>
            <option value="ROUND_ROBIN">Round Robin</option>
          </select>
        </div>

        {algorithm === "ROUND_ROBIN" && (
          <div className="control-group">
            <label>Time Quantum</label>
            <input
              type="number"
              min="1"
              value={quantum}
              onChange={(e) =>
                setQuantum(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
        )}

        <button
          type="button"
          className="simulate-button"
          onClick={simulate}
        >
          ▶ Simulate
        </button>
      </div>

      <div className="algorithm-info">
        {algorithm === "FCFS" && (
          <>
            <strong>FCFS (First-Come, First-Served)</strong>
            <p>
              Processes execute in the order in which they arrive. It is
              non-preemptive and simple, but prone to the convoy effect.
            </p>
          </>
        )}

        {algorithm === "SJF" && (
          <>
            <strong>SJF (Shortest Job First - Non-Preemptive)</strong>
            <p>
              The available process with the shortest burst time executes first
              to completion. Minimizes average waiting time.
            </p>
          </>
        )}

        {algorithm === "SRTF" && (
          <>
            <strong>SRTF (Shortest Remaining Time First)</strong>
            <p>
              Preemptive SJF where incoming jobs with shorter remaining burst
              times preempt currently executing jobs.
            </p>
          </>
        )}

        {algorithm === "PRIORITY" && (
          <>
            <strong>Priority Scheduling (Non-Preemptive)</strong>
            <p>
              The ready process with the highest priority executes first.
              Lower numerical value indicates higher priority (e.g., 1 is higher than 2).
            </p>
          </>
        )}

        {algorithm === "ROUND_ROBIN" && (
          <>
            <strong>Round Robin (RR)</strong>
            <p>
              Each process receives CPU time for a fixed slice (time quantum) in a
              cyclic ready queue, ensuring fair CPU distribution.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Controls;