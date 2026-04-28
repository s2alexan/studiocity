#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

for (const port of [8080, 5001]) {
  const lsof = spawnSync('lsof', ['-ti', `tcp:${port}`], {
    encoding: 'utf8',
  });
  const pids = lsof.stdout
    .split(/\s+/)
    .map((pid) => pid.trim())
    .filter(Boolean);

  for (const pid of pids) {
    spawnSync('kill', [pid], { stdio: 'ignore' });
  }
}
