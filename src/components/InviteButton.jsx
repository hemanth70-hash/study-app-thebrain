import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function InviteButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // This automatically detects your live Vercel URL
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
        copied 
        ? 'bg-green-500 text-white' 
        : 'bg-white dark:bg-gray-700 text-blue-600 hover:shadow-md border border-blue-100 dark:border-gray-600'
      }`}
    >
      {copied ? <Check size={18} /> : <Share2 size={18} />}
      {copied ? 'Link Copied!' : 'Invite Friends'}
    </button>
  );
}