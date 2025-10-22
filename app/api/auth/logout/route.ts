import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success as the client will handle token removal
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
