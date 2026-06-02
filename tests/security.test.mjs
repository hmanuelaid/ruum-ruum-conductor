import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

test('onboarding signup does not use SMS verification or store passwords', () => {
  const registration = read('app/onboarding/registro/page.tsx')
  const verificationPath = path.join(root, 'app/onboarding/verificacion/page.tsx')

  assert.equal(existsSync(verificationPath), false)
  assert.match(registration, /signUp/)
  assert.doesNotMatch(registration, /signInWithOtp|verifyOtp|channel:\s*['"]sms['"]|type:\s*['"]sms['"]/)
  assert.doesNotMatch(registration, /onboarding\/verificacion/)
  assert.doesNotMatch(registration, /driver_onboarding_draft|sessionStorage/i)
})

test('driver onboarding profile endpoint supports document step updates', () => {
  const profileRoute = read('app/api/drivers/profile/route.ts')

  assert.match(profileRoute, /export async function GET/)
  assert.match(profileRoute, /export async function POST/)
  assert.match(profileRoute, /export async function PATCH/)
  assert.match(profileRoute, /onboarding_status/)
  assert.match(profileRoute, /pendiente_validacion/)
})
