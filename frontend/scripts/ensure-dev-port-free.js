/* eslint-disable no-console */
const { execSync } = require("node:child_process");

const port = process.argv[2] || "9002";
const isWin = process.platform === "win32";

function unique(values) {
  return [...new Set(values)];
}

function killPids(pids) {
  if (!pids.length) {
    console.log(`[predev] Port ${port} is already free.`);
    return;
  }

  console.log(`[predev] Releasing port ${port} by stopping PID(s): ${pids.join(", ")}`);

  for (const pid of pids) {
    try {
      if (isWin) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      }
    } catch {
      // Ignore race conditions where process is already gone.
    }
  }
}

try {
  if (isWin) {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const pids = unique(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(/\s+/).pop())
        .filter((pid) => pid && pid !== "0")
    );

    killPids(pids);
  } else {
    const output = execSync(`lsof -ti tcp:${port}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const pids = unique(output.split(/\r?\n/).map((v) => v.trim()).filter(Boolean));
    killPids(pids);
  }
} catch {
  // If command returns non-zero, usually no process was found.
  console.log(`[predev] Port ${port} is already free.`);
}
