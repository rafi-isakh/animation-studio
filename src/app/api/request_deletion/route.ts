import { auth } from "@/auth";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER!,
            pass: process.env.EMAIL_PASSWORD!
        }
    });
    const mailOptions = {
        from: process.env.EMAIL_USER!,
        to: "jongminbaek@stelland.io",
        subject: "Account Deletion Request",
        text: "Account deletion requested: " + session.user.email
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Account deletion requested" }, { status: 200 });
}