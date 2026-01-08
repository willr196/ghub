import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { code } = await request.json()
    
    // Server-side secret code - NOT exposed to client
    const VALID_SECRET_CODE = process.env.SECRET_CODE || 'GHUB_CHRISTMAS_2024'
    
    if (code === VALID_SECRET_CODE) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json({ valid: false, error: 'Invalid secret code' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 })
  }
}
