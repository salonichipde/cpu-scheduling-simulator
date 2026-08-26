export function srtf(processes) {
  const list = processes
    .map((p) => ({
      ...p,
      remaining: p.burst,
      startTime: null,
      completion: null,
    }))
    .sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));

  const gantt = [];
  let time = 0;
  let completed = 0;

  while (completed < list.length) {
    const available = list
      .filter((p) => p.arrival <= time && p.remaining > 0)
      .sort(
        (a, b) =>
          a.remaining - b.remaining ||
          a.arrival - b.arrival ||
          a.id.localeCompare(b.id)
      );

    if (available.length === 0) {
      const nextArrival = Math.min(
        ...list
          .filter((p) => p.remaining > 0)
          .map((p) => p.arrival)
          .filter((a) => a > time)
      );

      addGantt(gantt, "IDLE", time, nextArrival);
      time = nextArrival;
      continue;
    }

    const current = available[0];

    if (current.startTime === null) {
      current.startTime = time;
    }

    addGantt(gantt, current.id, time, time + 1);

    current.remaining--;
    time++;

    if (current.remaining === 0) {
      current.completion = time;
      completed++;
    }
  }

  const result = list.map((p) => ({
    id: p.id,
    arrival: p.arrival,
    burst: p.burst,
    priority: p.priority,
    completion: p.completion,
    turnaround: p.completion - p.arrival,
    waiting: p.completion - p.arrival - p.burst,
    response: p.startTime - p.arrival,
  }));

  return buildResult(result, gantt);
}

function addGantt(gantt, id, start, end) {
  if (start === end) return;
  const last = gantt[gantt.length - 1];

  if (last && last.id === id && last.end === start) {
    last.end = end;
  } else {
    gantt.push({
      id,
      start,
      end,
    });
  }
}

function buildResult(processes, gantt) {
  const n = processes.length;

  const waiting =
    processes.reduce((sum, p) => sum + p.waiting, 0) / n;
  const turnaround =
    processes.reduce((sum, p) => sum + p.turnaround, 0) / n;
  const response =
    processes.reduce((sum, p) => sum + p.response, 0) / n;

  const totalTime =
    gantt.length > 0 ? gantt[gantt.length - 1].end : 0;

  const busy = processes.reduce((sum, p) => sum + p.burst, 0);

  const blocks = gantt.filter((g) => g.id !== "IDLE");

  return {
    processes,
    gantt,
    averages: {
      waiting: n === 0 ? 0 : waiting,
      turnaround: n === 0 ? 0 : turnaround,
      response: n === 0 ? 0 : response,
    },
    cpuUtilization:
      totalTime === 0 ? 0 : (busy / totalTime) * 100,
    throughput: totalTime === 0 ? 0 : n / totalTime,
    contextSwitches: Math.max(0, blocks.length - 1),
  };
}