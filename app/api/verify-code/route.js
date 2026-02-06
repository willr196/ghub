import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { code } = await request.json()
    const submittedCode = typeof code === 'string' ? code.trim() : ''
    
    // Require explicit configuration to avoid accidental open signup.
    const validSecretCode = process.env.SECRET_CODE?.trim()
    if (!validSecretCode) {
      return NextResponse.json({ valid: false, error: 'Server misconfigured' }, { status: 500 })
    }

    if (!submittedCode) {
      return NextResponse.json({ valid: false, error: 'Code is required' }, { status: 400 })
    }
    
    if (submittedCode.toLowerCase() === validSecretCode.toLowerCase()) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json({ valid: false, error: 'Invalid secret code' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 })
  }
}
