import { spawn } from 'node:child_process'
import { once } from 'node:events'

const port = Number(process.env.SMOKE_PORT ?? 3100)
const baseUrl = `http://127.0.0.1:${port}`

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'smoke-test-anon-key',
}

const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-p', String(port)],
  {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  }
)

let serverOutput = ''
server.stdout.on('data', chunk => {
  serverOutput += chunk.toString()
})
server.stderr.on('data', chunk => {
  serverOutput += chunk.toString()
})

async function stopServer() {
  if (server.exitCode !== null || server.signalCode) return
  server.kill('SIGTERM')
  await Promise.race([
    once(server, 'exit'),
    new Promise(resolve => setTimeout(resolve, 2000)),
  ])

  if (server.exitCode === null && !server.signalCode) {
    server.kill('SIGKILL')
  }
}

async function waitForServer() {
  const deadline = Date.now() + 40_000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited early:\n${serverOutput}`)
    }

    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: 'manual' })
      if (response.status === 200) return
    } catch {
      // Server is still booting.
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw new Error(`Timed out waiting for ${baseUrl}\n${serverOutput}`)
}

async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    redirect: 'manual',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  return response.status
}

async function assertStatus(method, path, expected, body) {
  const status = await request(method, path, body)
  if (status !== expected) {
    throw new Error(`${method} ${path} expected ${expected}, received ${status}`)
  }

  console.log(`${method} ${path} -> ${status}`)
}

try {
  await waitForServer()

  await assertStatus('GET', '/login', 200)
  await assertStatus('GET', '/api', 404)
  await assertStatus('GET', '/api/documents', 401)
  await assertStatus('PATCH', '/api/trips/T-001245', 401, { status: 'finalizado' })
  await assertStatus('POST', '/api/documents/upload', 401)
  await assertStatus('POST', '/api/trips/T-001245/evidence', 401)
  await assertStatus('GET', '/api/drivers/profile', 401)
  await assertStatus('POST', '/api/drivers/profile', 401, { name: 'Smoke Test' })
  await assertStatus('PATCH', '/api/drivers/profile', 401, { onboarding_status: 'submitted' })
} finally {
  await stopServer()
}
