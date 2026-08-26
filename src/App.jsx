import React, { useState } from "react";

// ==========================================
// 1. CPU SCHEDULING ALGORITHMS
// ==========================================

function buildCpuResult(processes, gantt, steps) {
  const n = processes.length;
  const totalWaiting = processes.reduce((sum, p) => sum + p.waiting, 0);
  const totalTurnaround = processes.reduce((sum, p) => sum + p.turnaround, 0);
  const totalResponse = processes.reduce((sum, p) => sum + p.response, 0);
  const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].end : 0;
  const busyTime = processes.reduce((sum, p) => sum + p.burst, 0);
  const executionBlocks = gantt.filter((x) => x.id !== "IDLE");

  return {
    processes,
    gantt,
    steps,
    averages: {
      waiting: n === 0 ? 0 : totalWaiting / n,
      turnaround: n === 0 ? 0 : totalTurnaround / n,
      response: n === 0 ? 0 : totalResponse / n,
    },
    cpuUtilization: totalTime === 0 ? 0 : (busyTime / totalTime) * 100,
    throughput: totalTime === 0 ? 0 : n / totalTime,
    contextSwitches: Math.max(0, executionBlocks.length - 1),
  };
}

function addGanttBlock(gantt, id, start, end) {
  if (start === end) return;
  const last = gantt[gantt.length - 1];
  if (last && last.id === id && last.end === start) {
    last.end = end;
  } else {
    gantt.push({ id, start, end });
  }
}

function runFCFS(processes) {
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));
  let time = 0;
  const gantt = [];
  const result = [];
  const steps = [];

  for (const p of sorted) {
    if (time < p.arrival) {
      steps.push({ timeRange: `${time} → ${p.arrival}`, action: "CPU IDLE", decision: `Waiting for ${p.id}` });
      gantt.push({ id: "IDLE", start: time, end: p.arrival });
      time = p.arrival;
    }
    const start = time;
    const end = time + p.burst;
    steps.push({ timeRange: `${start} → ${end}`, action: `Executed ${p.id}`, decision: `Non-preemptive run completed at t = ${end}` });
    gantt.push({ id: p.id, start, end });
    time = end;
    result.push({ ...p, completion: end, turnaround: end - p.arrival, waiting: end - p.arrival - p.burst, response: start - p.arrival });
  }
  return buildCpuResult(result, gantt, steps);
}

function runSJFPreemptive(processes) {
  const list = processes.map((p) => ({ ...p, remaining: p.burst, startTime: null, completion: null })).sort((a, b) => a.arrival - b.arrival);
  const gantt = [];
  const steps = [];
  let time = 0;
  let completed = 0;
  let lastPid = null;
  let blockStart = 0;

  while (completed < list.length) {
    const available = list.filter((p) => p.arrival <= time && p.remaining > 0).sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);
    if (available.length === 0) {
      const nextArrival = Math.min(...list.filter((p) => p.remaining > 0).map((p) => p.arrival).filter((a) => a > time));
      addGanttBlock(gantt, "IDLE", time, nextArrival);
      time = nextArrival;
      continue;
    }
    const current = available[0];
    if (current.startTime === null) current.startTime = time;
    if (lastPid !== current.id) {
      if (lastPid !== null) steps.push({ timeRange: `${blockStart} → ${time}`, action: `Executed ${lastPid}`, decision: `Preempted by ${current.id}` });
      lastPid = current.id;
      blockStart = time;
    }
    addGanttBlock(gantt, current.id, time, time + 1);
    current.remaining--;
    time++;
    if (current.remaining === 0) {
      current.completion = time;
      completed++;
      steps.push({ timeRange: `${blockStart} → ${time}`, action: `${current.id} finished`, decision: `Burst completed` });
      lastPid = null;
    }
  }
  const result = list.map((p) => ({ ...p, turnaround: p.completion - p.arrival, waiting: p.completion - p.arrival - p.burst, response: p.startTime - p.arrival }));
  return buildCpuResult(result, gantt, steps);
}

function runRoundRobin(processes, quantum) {
  const list = processes.map((p) => ({ ...p, remaining: p.burst, startTime: null, completion: null })).sort((a, b) => a.arrival - b.arrival);
  const queue = [];
  const gantt = [];
  const steps = [];
  let time = 0;
  let index = 0;
  let completed = 0;

  while (completed < list.length) {
    while (index < list.length && list[index].arrival <= time) { queue.push(list[index]); index++; }
    if (queue.length === 0) {
      if (index < list.length) {
        const next = list[index].arrival;
        addGanttBlock(gantt, "IDLE", time, next);
        time = next;
        while (index < list.length && list[index].arrival <= time) { queue.push(list[index]); index++; }
      } else break;
    }
    const current = queue.shift();
    if (current.startTime === null) current.startTime = time;
    const execTime = Math.min(quantum, current.remaining);
    const start = time;
    addGanttBlock(gantt, current.id, time, time + execTime);
    time += execTime;
    current.remaining -= execTime;
    while (index < list.length && list[index].arrival <= time) { queue.push(list[index]); index++; }
    if (current.remaining > 0) queue.push(current);
    else { current.completion = time; completed++; }
    steps.push({ timeRange: `${start} → ${time}`, action: `${current.id} executed (${execTime} units)`, decision: current.remaining > 0 ? "Time quantum expired" : "Process completed" });
  }
  const result = list.map((p) => ({ ...p, turnaround: p.completion - p.arrival, waiting: p.completion - p.arrival - p.burst, response: p.startTime - p.arrival }));
  return buildCpuResult(result, gantt, steps);
}

// ==========================================
// 2. PAGE REPLACEMENT ALGORITHMS
// ==========================================

function runFIFOPageReplacement(pages, capacity) {
  let memory = [];
  let steps = [];
  let pageFaults = 0;
  let pageHits = 0;

  pages.forEach((page, i) => {
    let isHit = memory.includes(page);
    if (isHit) {
      pageHits++;
      steps.push({ step: i + 1, page, memory: [...memory], status: "HIT", note: `Page ${page} already in memory.` });
    } else {
      pageFaults++;
      if (memory.length < capacity) {
        memory.push(page);
      } else {
        memory.shift();
        memory.push(page);
      }
      steps.push({ step: i + 1, page, memory: [...memory], status: "FAULT", note: `Page ${page} brought into memory (Oldest removed).` });
    }
  });

  return { steps, pageFaults, pageHits, hitRatio: (pageHits / pages.length) * 100, faultRatio: (pageFaults / pages.length) * 100 };
}

function runLRUPageReplacement(pages, capacity) {
  let memory = [];
  let lastUsed = new Map();
  let steps = [];
  let pageFaults = 0;
  let pageHits = 0;

  pages.forEach((page, i) => {
    let isHit = memory.includes(page);
    lastUsed.set(page, i);

    if (isHit) {
      pageHits++;
      steps.push({ step: i + 1, page, memory: [...memory], status: "HIT", note: `Page ${page} already in memory. Updated recent use.` });
    } else {
      pageFaults++;
      if (memory.length < capacity) {
        memory.push(page);
      } else {
        let lruPage = memory.reduce((oldest, p) => (lastUsed.get(p) < lastUsed.get(oldest) ? p : oldest), memory[0]);
        memory = memory.filter((p) => p !== lruPage);
        memory.push(page);
      }
      steps.push({ step: i + 1, page, memory: [...memory], status: "FAULT", note: `Page ${page} caused FAULT. Replaced least recently used page.` });
    }
  });

  return { steps, pageFaults, pageHits, hitRatio: (pageHits / pages.length) * 100, faultRatio: (pageFaults / pages.length) * 100 };
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState("cpu"); // 'cpu' or 'page'

  // CPU State
  const [processes, setProcesses] = useState([
    { id: "P1", arrival: 0, burst: 4, priority: 2 },
    { id: "P2", arrival: 1, burst: 3, priority: 1 },
    { id: "P3", arrival: 2, burst: 7, priority: 3 },
  ]);
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);
  const [cpuResult, setCpuResult] = useState(null);

  // Page Replacement State
  const [referenceString, setReferenceString] = useState("7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2");
  const [frameCapacity, setFrameCapacity] = useState(3);
  const [pageAlgo, setPageAlgo] = useState("FIFO");
  const [pageResult, setPageResult] = useState(null);

  const simulateCpu = () => {
    const clean = processes.map((p) => ({
      id: p.id,
      arrival: Math.max(0, Number(p.arrival) || 0),
      burst: Math.max(1, Number(p.burst) || 1),
      priority: Math.max(1, Number(p.priority) || 1),
    }));
    if (algorithm === "FCFS") setCpuResult(runFCFS(clean));
    else if (algorithm === "SJF_P") setCpuResult(runSJFPreemptive(clean));
    else if (algorithm === "ROUND_ROBIN") setCpuResult(runRoundRobin(clean, Number(quantum)));
  };

  const simulatePageReplacement = () => {
    const pages = referenceString
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .map(Number);
    const capacity = Math.max(1, Number(frameCapacity) || 3);

    if (pageAlgo === "FIFO") setPageResult(runFIFOPageReplacement(pages, capacity));
    else if (pageAlgo === "LRU") setPageResult(runLRUPageReplacement(pages, capacity));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", color: "#172033" }}>
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">
          <div className="logo-box">OS</div>
          <div>
            <strong>OS Virtual Lab Suite</strong>
            <small>Interactive Simulator</small>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveTab("cpu")}
            style={{
              background: activeTab === "cpu" ? "#2563eb" : "#e2e8f0",
              color: activeTab === "cpu" ? "#fff" : "#1e293b",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            CPU Scheduling
          </button>
          <button
            onClick={() => setActiveTab("page")}
            style={{
              background: activeTab === "page" ? "#2563eb" : "#e2e8f0",
              color: activeTab === "page" ? "#fff" : "#1e293b",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Page Replacement
          </button>
        </div>
      </header>

      <main className="container">
        {/* ========================================== */}
        {/* TAB 1: CPU SCHEDULING */}
        {/* ========================================== */}
        {activeTab === "cpu" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">OPERATING SYSTEMS LAB</p>
                <h1>CPU Scheduling <span>Simulator</span></h1>
                <p className="hero-description">Enter process details to generate Gantt chart and step-by-step math trace.</p>
              </div>
            </section>

            <section className="card">
              <div className="section-title">
                <h2>Process Configuration</h2>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Process ID</th>
                      <th>Arrival Time</th>
                      <th>Burst Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((p, idx) => (
                      <tr key={idx}>
                        <td><input type="text" value={p.id} onChange={(e) => { const cp = [...processes]; cp[idx].id = e.target.value; setProcesses(cp); }} /></td>
                        <td><input type="number" value={p.arrival} onChange={(e) => { const cp = [...processes]; cp[idx].arrival = Number(e.target.value); setProcesses(cp); }} /></td>
                        <td><input type="number" value={p.burst} onChange={(e) => { const cp = [...processes]; cp[idx].burst = Number(e.target.value); setProcesses(cp); }} /></td>
                        <td><button type="button" className="delete-button" onClick={() => setProcesses(processes.filter((_, i) => i !== idx))}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="add-button" onClick={() => setProcesses([...processes, { id: `P${processes.length + 1}`, arrival: 0, burst: 1, priority: 1 }])}>+ Add Process</button>

              <div className="controls" style={{ display: "flex", gap: "12px", marginTop: "16px", alignItems: "flex-end" }}>
                <div className="control-group">
                  <label>Algorithm</label>
                  <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                    <option value="FCFS">FCFS</option>
                    <option value="SJF_P">SJF (Preemptive / SRTF)</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>
                {algorithm === "ROUND_ROBIN" && (
                  <div className="control-group">
                    <label>Quantum</label>
                    <input type="number" value={quantum} onChange={(e) => setQuantum(Number(e.target.value))} />
                  </div>
                )}
                <button type="button" className="simulate-button" onClick={simulateCpu}>▶ Simulate</button>
              </div>
            </section>

            {cpuResult && (
              <section className="card">
                <h2>Gantt Chart & Results</h2>
                <div className="gantt" style={{ marginTop: "12px" }}>
                  {cpuResult.gantt.map((b, i) => (
                    <div key={i} className={b.id === "IDLE" ? "gantt-item idle" : "gantt-item"} style={{ flexGrow: b.end - b.start }}>
                      <strong>{b.id}</strong>
                      <small>{b.start} - {b.end}</small>
                    </div>
                  ))}
                </div>
                <div className="metrics" style={{ marginTop: "16px" }}>
                  <div className="metric"><span>Avg Waiting</span><strong>{cpuResult.averages.waiting.toFixed(2)}</strong></div>
                  <div className="metric"><span>Avg Turnaround</span><strong>{cpuResult.averages.turnaround.toFixed(2)}</strong></div>
                  <div className="metric"><span>CPU Utilization</span><strong>{cpuResult.cpuUtilization.toFixed(2)}%</strong></div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ========================================== */}
        {/* TAB 2: PAGE REPLACEMENT */}
        {/* ========================================== */}
        {activeTab === "page" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">MEMORY MANAGEMENT</p>
                <h1>Page Replacement <span>Simulator</span></h1>
                <p className="hero-description">Calculate page hits, page faults, and visualize frame allocations step-by-step.</p>
              </div>
            </section>

            <section className="card">
              <div className="section-title">
                <h2>Reference String & Frame Setup</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px", alignItems: "flex-end" }}>
                <div className="control-group">
                  <label>Page Reference String (Comma/Space separated)</label>
                  <input type="text" value={referenceString} onChange={(e) => setReferenceString(e.target.value)} />
                </div>
                <div className="control-group">
                  <label>Frame Capacity</label>
                  <input type="number" min="1" max="8" value={frameCapacity} onChange={(e) => setFrameCapacity(Number(e.target.value))} />
                </div>
                <div className="control-group">
                  <label>Algorithm</label>
                  <select value={pageAlgo} onChange={(e) => setPageAlgo(e.target.value)}>
                    <option value="FIFO">FIFO (First-In, First-Out)</option>
                    <option value="LRU">LRU (Least Recently Used)</option>
                  </select>
                </div>
                <button type="button" className="simulate-button" onClick={simulatePageReplacement}>▶ Run Page Simulation</button>
              </div>
            </section>

            {pageResult && (
              <section className="card">
                <h2>Simulation Trace & Page Faults</h2>
                <div className="metrics" style={{ marginTop: "12px" }}>
                  <div className="metric"><span>Total Page Faults (Misses)</span><strong>{pageResult.pageFaults}</strong></div>
                  <div className="metric"><span>Total Page Hits</span><strong>{pageResult.pageHits}</strong></div>
                  <div className="metric"><span>Hit Ratio</span><strong>{pageResult.hitRatio.toFixed(2)}%</strong></div>
                  <div className="metric"><span>Fault Ratio</span><strong>{pageResult.faultRatio.toFixed(2)}%</strong></div>
                </div>

                <div className="table-wrapper result-table" style={{ marginTop: "16px" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Incoming Page</th>
                        <th>Frames in Memory</th>
                        <th>Status</th>
                        <th>Decision / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageResult.steps.map((s) => (
                        <tr key={s.step} style={{ background: s.status === "HIT" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.05)" }}>
                          <td>{s.step}</td>
                          <td><strong>{s.page}</strong></td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {s.memory.map((m, idx) => (
                                <span key={idx} style={{ background: "#e2e8f0", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold" }}>{m}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span style={{ color: s.status === "HIT" ? "#10b981" : "#ef4444", fontWeight: "bold" }}>{s.status}</span>
                          </td>
                          <td>{s.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer>Operating Systems Virtual Lab Suite</footer>
    </div>
  );
}