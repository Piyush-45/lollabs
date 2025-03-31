'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface SummaryProps {
    summaryText: string;
}

const Summary = ({ summaryText }: SummaryProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        toast.success('Summary copied! 📋');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="w-full bg-[#fefdfc] border border-[#f5ebe0] shadow-xl rounded-2xl animate-in fade-in duration-300">
            <CardHeader className="flex flex-col items-start gap-2 p-6">
                <div className="flex w-full justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#2d2a32] font-baloo">
                        🩺 Tera Health Report Ka Gyaan
                    </h2>
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="icon"
                        className="hover:bg-[#f9f4ef]"
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                    AI ne bola, tu thoda chill kar le 😌
                </p>
            </CardHeader>

            <CardContent className="p-6 pt-0">
                <ScrollArea className="h-[600px] pr-3">
                    <div className="text-base leading-relaxed whitespace-pre-wrap font-poppins text-[#3a3a3a]">
                        <ReactMarkdown>{summaryText}</ReactMarkdown>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default Summary;
