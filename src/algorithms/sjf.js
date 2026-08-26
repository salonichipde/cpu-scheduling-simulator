export function sjf(processes) {
  const remaining = processes.map((p) => ({
    ...p,
    completed: false,
  }));

  const result = [];
  const gantt = [];

  let time = 0;
  let completed = 0;

  while (completed < remaining.length) {
    const available = remaining
      .filter((p) => !p.completed && p.arrival <= time)
      .sort(
        (a, b) =>
          a.burst - b.burst ||
          a.arrival - b.arrival ||
          a.id.localeCompare(b.id)
      );

    if (available.length === 0) {
      const next = remaining
        .filter((p) => !p.completed)
        .sort(
          (a, b) =>
            a.arrival - b.arrival ||
            a.id.localeCompare(b.id)
        )[0];

      gantt.push({
        id: "IDLE",
        start: time,
        end: next.arrival,
      });
      time = next.arrival;
      continue;
    }

    const p = available[0];
    const start = time;
    time += p.burst;
    const completion = time;

    gantt.push({
      id: p.id,
      start,
      end: completion,
    });

    p.completed = true;

    result.push({
      ...p,
      completion,
      turnaround: completion - p.arrival,
      waiting: completion - p.arrival - p.burst,
      response: start - p.arrival,
    });

    completed++;
  }

  return buildResult(result, gantt);
}

function buildResult(processes, gantt) {
  const n = processes.length;

  const avgWaiting =
    processes.reduce((sum, p) => sum + p.waiting, 0) / n;
  const avgTurnaround =
    processes.reduce((sum, p) => sum + p.turnaround, 0) / n;
  const avgResponse =
    processes.reduce((sum, p) => sum + p.response, 0) / n;

  const totalTime =
    gantt.length > 0 ? gantt[gantt.length - 1].end : 0;

  const busy = processes.reduce((sum, p) => sum + p.burst, 0);
  const executionBlocks = gantt.filter((g) => g.id !== "IDLE");

  return {
    processes,
    gantt,
    averages: {
      waiting: n === 0 ? 0 : avgWaiting,
      turnaround: n === 0 ? 0 : avgTurnaround,
      response: n === 0 ? 0 : avgResponse,
    },
    cpuUtilization:
      totalTime === 0 ? 0 : (busy / totalTime) * 100,
    throughput: totalTime === 0 ? 0 : n / totalTime,
    contextSwitches: Math.max(0, executionBlocks.length - 1),
  };
}