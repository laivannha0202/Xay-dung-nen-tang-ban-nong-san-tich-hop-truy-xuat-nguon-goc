import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const pnpmBin = platform() === 'win32' ? 'pnpm.cmd' : 'pnpm';

const child = spawn(pnpmBin, ['--filter', '@agrimarket/customer-web', 'dev'], {
  stdio: 'inherit',
  // pnpm.cmd trên Windows bắt buộc chạy qua shell (shell:false → EINVAL).
  shell: platform() === 'win32',
  detached: platform() !== 'win32',
});

child.once('exit', (code) => {
  if (code && code !== 0) {
    console.error(`Customer Web exited with code ${code}`);
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error(`spawn error: ${err.message}`);
  process.exit(1);
});
