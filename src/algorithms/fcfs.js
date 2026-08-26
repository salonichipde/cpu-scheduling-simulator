export function fcfs(processes) {
  const sorted = [...processes].sort(
    (a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id)
  );

  let time = 0;
  const gantt = [];
  const result = [];

  for (const p of sorted) {
    if (time < p.arrival) {
      gantt.push({
        id: "IDLE",
        start: time,
        end: p.arrival,
      });
      time = p.arrival;
    }

    const start = time;
    const end = time + p.burst;

    gantt.push({
      id: p.id,
      start,
      end,
    });

    time = end;

    result.push({
      ...p,
      completion: end,
      turnaround: end - p.arrival,
      waiting: end - p.arrival - p.burst,
      response: start - p.arrival,
    });
  }

  return buildResult(result, gantt);
}

function buildResult(processes, gantt) {
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