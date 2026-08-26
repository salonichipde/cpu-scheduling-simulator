import React from "react";

function ProcessTable({ processes, updateProcess, deleteProcess }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Process ID</th>
            <th>Arrival Time</th>
            <th>Burst Time</th>
            <th>Priority</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {processes.map((process, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  value={process.id}
                  onChange={(e) =>
                    updateProcess(index, "id", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  min="0"
                  value={process.arrival}
                  onChange={(e) =>
                    updateProcess(index, "arrival", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  min="1"
                  value={process.burst}
                  onChange={(e) =>
                    updateProcess(index, "burst", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  min="1"
                  value={process.priority}
                  onChange={(e) =>
                    updateProcess(index, "priority", e.target.value)
                  }
                />
              </td>

              <td>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteProcess(index)}
                  disabled={processes.length === 1}
                  title={
                    processes.length === 1
                      ? "At least one process is required"
                      : "Delete process"
                  }
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProcessTable;