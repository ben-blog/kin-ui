import { handleKinProxy } from '../../../../lib/kinProxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function handler(request, context) {
  return handleKinProxy(request, context, '/api/web-learning')
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
