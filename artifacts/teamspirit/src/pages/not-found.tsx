import React from 'react';
import { Link } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6 px-4 animate-in fade-in duration-500">
      <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <h1 className="text-6xl font-display font-bold uppercase tracking-tight">
        404 <span className="text-primary">Offside.</span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-md">
        You've wandered off the pitch. The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg" className="font-bold tracking-wider uppercase h-14 px-8 mt-4">
          Back to the Pitch
        </Button>
      </Link>
    </div>
  );
}
