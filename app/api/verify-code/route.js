import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { code } = await request.json()
    
    // Require explicit configuration to avoid accidental open signup.
    const validSecretCode = process.env.SECRET_CODE
    if (!validSecretCode) {
      return NextResponse.json({ valid: false, error: 'Server misconfigured' }, { status: 500 })
    }
    
    if (code === validSecretCode) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json({ valid: false, error: 'Invalid secret code' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 })
  }
}
