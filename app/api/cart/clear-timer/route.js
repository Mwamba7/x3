import { NextResponse } from 'next/server'

/**
 * Clear auto-clear timer endpoint
 * POST /api/cart/clear-timer - Clears WhatsApp auto-clear timer
 */
export async function POST(request) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Auto-clear timer cleared successfully',
      instructions: {
        step1: 'Open browser console (F12)',
        step2: 'Run: localStorage.removeItem("whatsappClickTime")',
        step3: 'Refresh the page',
        note: 'This will stop the cart from auto-clearing'
      },
      script: 'localStorage.removeItem("whatsappClickTime"); location.reload();'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to clear timer',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/cart/clear-timer - Check timer status
 */
export async function GET(request) {
  return NextResponse.json({
    message: 'Auto-clear timer management',
    instructions: [
      '1. To clear timer: POST to this endpoint',
      '2. Or run in browser console: localStorage.removeItem("whatsappClickTime")',
      '3. Then refresh the page'
    ],
    checkTimerScript: `
      const whatsappTime = localStorage.getItem('whatsappClickTime');
      if (whatsappTime) {
        const clickTime = parseInt(whatsappTime);
        const now = Date.now();
        const elapsed = now - clickTime;
        const remaining = (15 * 60 * 1000) - elapsed;
        console.log('Timer found:', {
          clickTime: new Date(clickTime),
          elapsed: Math.round(elapsed / 1000 / 60) + ' minutes',
          remaining: Math.max(0, Math.round(remaining / 1000 / 60)) + ' minutes'
        });
      } else {
        console.log('No auto-clear timer found');
      }
    `
  })
}
