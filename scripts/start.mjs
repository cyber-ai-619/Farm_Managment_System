import { execFileSync, spawn } from 'node:child_process'
import process from 'node:process'

function findPortOwner(port) {
  const output = execFileSync('netstat', ['-ano'], { encoding: 'utf8' })

  for (const line of output.split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/)
    if (columns[0] === 'TCP' && columns[1]?.endsWith(`:${port}`) && columns[3] === 'LISTENING') {
      return Number(columns[4])
    }
  }

  return undefined
}

const port = 5173
const ownerPid = findPortOwner(port)

if (ownerPid && ownerPid !== process.pid) {
  if (process.platform === 'win32') {
    execFileSync('taskkill', ['/PID', String(ownerPid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    process.kill(ownerPid, 'SIGTERM')
  }
}

const command = process.platform === 'win32' ? process.env.ComSpec : 'npm'
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', `npm --prefix ffms-frontend run dev -- --port ${port} --strictPort`]
  : ['--prefix', 'ffms-frontend', 'run', 'dev', '--', '--port', String(port), '--strictPort']
const server = spawn(command, args, {
  stdio: 'inherit',
})

server.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
