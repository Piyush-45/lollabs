'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface SummaryProps {
    summaryText: string;
}

const Summary = ({ summaryText }: SummaryProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        toast.success('Summary copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="w-full shadow-md border bg-background animate-in fade-in duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold tracking-tight">
                    🧠 AI-Generated Summary
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[800px] pr-2">
                    <div className="prose prose-sm text-muted-foreground whitespace-pre-wrap">
                        <ReactMarkdown>
                            {summaryText}
                        </ReactMarkdown>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default Summary;
