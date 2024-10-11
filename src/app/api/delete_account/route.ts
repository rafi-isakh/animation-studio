import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")
  
    if (!session || !session.user) {
      return NextResponse.json({
        "message": "Unauthorized!!",
        "status": 401
      });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_account?email=${email}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
          }
    })
    
    if (!response.ok) {
        console.error("Failed to delete account", email)
        return NextResponse.json({
            "message": "Failed to delete account",
            "status": 500
        })
    }
    
    return NextResponse.json({
        "message": "Deleted account",
        "status": 200
    })

}