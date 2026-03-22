import { ok } from "assert";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
    try {
        const resp = await openai.responses.create({
            model: "gpt-5.4-mini",
            input: "한 줄로 인사해줘. 임의로 이모티콘도 써줘.",
    });

    return NextResponse.json({
        ok: true,
        text: resp.output_text,
    });
} catch (error) {
    console.error(error);
    return NextResponse.json(
        {ok: false, error: "OpenAI 호출 실패"},
        {status: 500},
    );
  }
}