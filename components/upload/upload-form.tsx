'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { z } from 'zod';
import { useUploadThing } from '@/lib/uploadthing';
import { toast } from 'sonner';
import { generatePdfSummary, storePdfSummaryAction } from '@/actions/upload-action';
import Summary from '../common/Summary'; // ✅ Ensure this accepts summaryText as prop

// ✅ Zod schema for file validation
const schema = z.object({
    file: z
        .custom<File>((file) => file instanceof File, { message: 'Invalid file' })
        .refine((file) => file.size <= 20 * 1024 * 1024, {
            message: 'File size must be less than 20MB',
        })
        .refine((file) => file.type.startsWith('application/pdf'), 'File must be a PDF')
});

const Uploadform = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [summaryText, setSummaryText] = useState(''); // ✅ Holds the generated summary

    const { startUpload } = useUploadThing('pdfUploader', {
        onClientUploadComplete: () => toast.success("Your PDF has been uploaded successfully"),
        onUploadError: (error: any) => {
            toast.error('Error occurred while uploading');
            console.error('Upload error:', error);
        },
        onUploadBegin: (fileName) => toast(`Uploading ${fileName}...`)
    });

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const file = formData.get('file');

        if (!(file instanceof File)) {
            toast.error('Invalid file');
            return;
        }

        const validatedFields = schema.safeParse({ file });
        if (!validatedFields.success) {
            toast.error(validatedFields.error.flatten().fieldErrors.file?.[0] ?? 'Invalid file');
            return;
        }

        setIsLoading(true);
        setSummaryText(""); // ✅ Clear old summary before generating a new one

        // ✅ Start upload process
        const uploadToastId = toast.loading('Uploading PDF...');
        const resp = await startUpload([file]);

        if (!resp) {
            toast.error('Upload Failed', { id: uploadToastId });
            setIsLoading(false);
            return;
        }

        toast.success('PDF uploaded successfully!', { id: uploadToastId });

        // ✅ Generate summary
        const summaryToastId = toast.loading('Generating summary...');
        const summary = await generatePdfSummary(resp);

        if (!summary.success || !summary.data?.summary) {
            toast.error(summary.message ?? "Summary failed", { id: summaryToastId });
        } else {
            toast.success("Summary saved successfully", { id: summaryToastId });

            // ✅ Save summary to DB using correct fields
            await storePdfSummaryAction({
                summary: summary?.data.summary, // 🟢 Use correct summary text
                fileUrl: resp[0].serverData.file.url, // 🟢 From UploadThing response
                fileName: resp[0].serverData.file.name, // 🟢 Use uploaded filename
                title: summary.data.title ?? "Untitled" // 🟢 Optional: use title or fallback
            });

            setSummaryText(summary?.data.summary); // ✅ Update UI with summary
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
            <UploadFormInput onSubmit={onSubmit} isLoading={isLoading} />

            {/* ✅ Conditionally render summary */}
            {summaryText && (
                <Summary summaryText={summaryText} />
            )}
        </div>
    );
};

export default Uploadform;

interface UploadFormInputProps {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
}

// ✅ Reusable input form component
const UploadFormInput: React.FC<UploadFormInputProps> = ({ onSubmit, isLoading }) => {
    return (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <div className="flex justify-end items-center gap-1.5">
                <Input
                    type="file"
                    id="file"
                    name="file"
                    accept="application/pdf"
                    required
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Upload your PDF"}
                </Button>
            </div>
        </form>
    );
};
