import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backendUrl = 'http://127.0.0.1:8000/api/health'
const frontendUrl = 'http://127.0.0.1:5173/'
const children = new Set()

async function isReachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1200) })
    return response.ok
  } catch {
    return false
  }
}

function track(child, label) {
  children.add(child)
  child.once('error', (error) => {
    console.error(`${label} failed to start: ${error.message}`)
  })
  child.once('exit', (code, signal) => {
    children.delete(child)
    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}${signal ? ` (${signal})` : ''}`)
    }
  })
  return child
}

function stopChildren() {
  for (const child of children) {
    child.kill('SIGTERM')
  }
}

async function startBackend() {
  if (await isReachable(backendUrl)) {
    console.log('FFMS API is already available at http://127.0.0.1:8000')
    return
  }

  const xamppPhp = 'C:\\xampp\\php\\php.exe'
  const php = process.env.FFMS_PHP_PATH || (existsSync(xamppPhp) ? xamppPhp : 'php')
  const backend = track(spawn(php, ['-S', '127.0.0.1:8000', '-t', 'backend/public', 'backend/public/index.php'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      DB_HOST: process.env.DB_HOST || '127.0.0.1',
      DB_PORT: process.env.DB_PORT || '3306',
      DB_DATABASE: process.env.DB_DATABASE || 'farm_management',
      DB_USERNAME: process.env.DB_USERNAME || 'root',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
    },
  }), 'FFMS API')

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isReachable(backendUrl)) {
      console.log('FFMS API is ready at http://127.0.0.1:8000')
      return
    }
    if (backend.exitCode !== null) break
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  throw new Error('FFMS API did not become ready. Check XAMPP MySQL and the PHP server output above.')
}

async function startFrontend() {
  if (await isReachable(frontendUrl)) {
    console.log('Frontend is already available at http://127.0.0.1:5173')
    return
  }

  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const frontend = track(spawn(command, [
    '--prefix', 'ffms-frontend', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort',
  ], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }), 'Frontend')

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isReachable(frontendUrl)) {
      console.log('Frontend is ready at http://127.0.0.1:5173')
      return
    }
    if (frontend.exitCode !== null) break
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  throw new Error('Frontend did not become ready. Check the Vite output above.')
}

process.once('SIGINT', stopChildren)
process.once('SIGTERM', stopChildren)

try {
  await startBackend()
  await startFrontend()
} catch (error) {
  console.error(error.message)
  stopChildren()
  process.exitCode = 1
}
