
'use server';

import { generatePdfSummaryFromGemini } from "@/lib/gemini";
import { fetchAndExtractPdfText } from "@/lib/langchain";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { generatePdfSummaryFromGroq } from "@/lib/groq";

const prisma = new PrismaClient();
export async function generatePdfSummary(uploadResponse: [
    {
        serverData: {
            file: { url: string; name: string };
        };
    }
]) {
    if (!uploadResponse || !uploadResponse[0]) {
        return { success: false, message: "File upload failed", data: null };
    }

    //!!!!!!!!!!!!!!!!!!
    const { userId } = await auth(); // ✅ Get user from Clerk

    console.log(userId)
    // if (!userId) {
    //     return { success: false, message: "Unauthorized", data: null };
    // }


    const {
        serverData: {
            file: { url: pdfUrl, name: fileName },
        },
    } = uploadResponse[0];

    if (!pdfUrl) {
        return { success: false, message: "Missing PDF URL", data: null };
    }

    try {
        const pdfText = await fetchAndExtractPdfText(pdfUrl);
        let summaryText;

        try {
            summaryText = await generatePdfSummaryFromGroq(pdfText);
            console.log(summaryText);
        } catch (error) {
            console.error("Error generating summary:", error);
            return { success: false, message: "AI summary failed", data: null };
        }

        if (!summaryText) {
            return { success: false, message: "Failed to generate summary", data: null };
        }

        // ✅ Save summary in database
        const savedSummary = await prisma.pdfSummary.create({
            data: {
                userId: '14f94f32-ab26-4f01-9f9f-8ebb9f86b57f', // ✅ Use UUID as userId reference
                originalFileUrl: pdfUrl,
                summaryText,
                fileName,
                status: "completed",
            },
        });

        return { success: true, message: "Summary saved", data: savedSummary };
    } catch (err) {
        console.error(err);
        return { success: false, message: "Error processing the file", data: null };
    }
}