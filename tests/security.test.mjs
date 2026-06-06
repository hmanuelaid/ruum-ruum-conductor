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

test('sensitive driver endpoints enforce rate limits by driver context', () => {
  const apiAuth = read('lib/api-auth.ts')
  const rateLimit = read('lib/rateLimit.ts')
  const uploadRoute = read('app/api/documents/upload/route.ts')
  const acceptRoute = read(path.join('app', 'api', 'trips', '[id]', 'aceptar', 'route.ts'))
  const rejectRoute = read(path.join('app', 'api', 'trips', '[id]', 'rechazar', 'route.ts'))

  assert.match(rateLimit, /@upstash\/ratelimit/)
  assert.match(rateLimit, /UPSTASH_REDIS_REST_URL/)
  assert.match(rateLimit, /UPSTASH_REDIS_REST_TOKEN/)
  assert.match(rateLimit, /x-forwarded-for/)
  assert.match(rateLimit, /NextResponse\.json\([\s\S]*status:\s*429/)
  assert.match(apiAuth, /driverId \?\? user\.id/)
  assert.match(apiAuth, /checkRateLimit\(/)
  assert.match(uploadRoute, /getApiAuthContext\(req,\s*'upload'\)/)
  assert.match(acceptRoute, /getApiAuthContext\(req,\s*'trips'\)/)
  assert.match(rejectRoute, /getApiAuthContext\(req,\s*'trips'\)/)
})

test('driver availability updates are observable when they fail', () => {
  const helper = read('lib/driver-availability.ts')
  const acceptRoute = read(path.join('app', 'api', 'trips', '[id]', 'aceptar', 'route.ts'))
  const rejectRoute = read(path.join('app', 'api', 'trips', '[id]', 'rechazar', 'route.ts'))
  const tripRoute = read(path.join('app', 'api', 'trips', '[id]', 'route.ts'))

  assert.match(helper, /availability_status update failed/)
  assert.match(helper, /console\.error/)
  assert.match(helper, /driverId/)
  assert.match(helper, /tripId/)
  assert.match(acceptRoute, /updateDriverAvailabilityBestEffort\([\s\S]*'aceptar'[\s\S]*'en_viaje'/)
  assert.match(rejectRoute, /updateDriverAvailabilityBestEffort\([\s\S]*'rechazar'[\s\S]*'disponible'/)
  assert.match(tripRoute, /updateDriverAvailabilityBestEffort\([\s\S]*'trip-status'[\s\S]*'disponible'/)
})

test('trip state machine is shared from @ruum/types', () => {
  const tripFlow = read('lib/trip-flow.ts')
  const sharedTypes = read('packages/ruum-types/src/index.ts')

  assert.match(sharedTypes, /TRIP_NEXT_STATUS/)
  assert.match(sharedTypes, /TRIP_REQUIRED_EVIDENCE/)
  assert.match(sharedTypes, /function isAllowedTripTransition/)
  assert.match(sharedTypes, /function getRequiredEvidenceForTransition/)
  assert.match(tripFlow, /from '@ruum\/types'/)
  assert.doesNotMatch(tripFlow, /function isAllowedTripTransition/)
  assert.doesNotMatch(tripFlow, /function getRequiredEvidenceForTransition/)
})
