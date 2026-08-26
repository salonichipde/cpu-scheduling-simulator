export function roundRobin(processes, quantum) {
  const list = processes
    .map((p) => ({
      ...p,
      remaining: p.burst,
      startTime: null,
      completion: null,
    }))
    .sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));

  const queue = [];
  const gantt = [];

  let time = 0;
  let index = 0;
  let completed = 0;

  while (completed < list.length) {
    // Add all processes that have arrived up to current time
    while (index < list.length && list[index].arrival <= time) {
      queue.push(list[index]);
      index++;
    }

    // Handle CPU idle state when queue is empty
    if (queue.length === 0) {
      if (index < list.length) {
        const nextArrival = list[index].arrival;
        addGantt(gantt, "IDLE", time, nextArrival);
        time = nextArrival;

        while (index < list.length && list[index].arrival <= time) {
          queue.push(list[index]);
          index++;
        }
      } else {
        break;
      }
    }

    const current = queue.shift();

    if (current.startTime === null) {
      current.startTime = time;
    }

    const executionTime = Math.min(quantum, current.remaining);
    addGantt(gantt, current.id, time, time + executionTime);

    time += executionTime;
    current.remaining -= executionTime;

    // Enqueue processes that arrived during the current time slice
    while (index < list.length && list[index].arrival <= time) {
      queue.push(list[index]);
      index++;
    }

    // If still remaining, push back to queue; otherwise complete
    if (current.remaining > 0) {
      queue.push(current);
    } else {
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

  const avgWaiting =
    processes.reduce((sum, p) => sum + p.waiting, 0) / n;
  const avgTurnaround =
    processes.reduce((sum, p) => sum + p.turnaround, 0) / n;
  const avgResponse =
    processes.reduce((sum, p) => sum + p.response, 0) / n;

  const totalTime =
    gantt.length > 0 ? gantt[gantt.length - 1].end : 0;

  const busy = processes.reduce((sum, p) => sum + p.burst, 0);
  const blocks = gantt.filter((g) => g.id !== "IDLE");

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
    contextSwitches: Math.max(0, blocks.length - 1),
  };
}