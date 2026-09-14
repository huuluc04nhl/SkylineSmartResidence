'use client';

import React from 'react';

interface AiMessageFormatterProps {
  content: string;
  isUser?: boolean;
}

export default function AiMessageFormatter({ content, isUser = false }: AiMessageFormatterProps) {
  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  // Split content by paragraphs/double line breaks
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="space-y-2.5 leading-relaxed text-gray-200">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        
        // Check if all or most lines are bullet list items
        const isBulletList = lines.every((l) => /^\s*[\*\-•]\s+/.test(l.trim()) || l.trim() === '');
        const isNumberedList = lines.every((l) => /^\s*\d+[\.\)]\s+/.test(l.trim()) || l.trim() === '');

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-1.5 pl-1">
              {lines
                .filter((l) => l.trim() !== '')
                .map((line, lIdx) => {
                  const itemText = line.replace(/^\s*[\*\-•]\s+/, '');
                  return (
                    <li key={lIdx} className="flex items-start gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] mt-1.5 flex-shrink-0" />
                      <span className="flex-1">{renderFormattedText(itemText)}</span>
                    </li>
                  );
                })}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-1.5 my-1.5 pl-1">
              {lines
                .filter((l) => l.trim() !== '')
                .map((line, lIdx) => {
                  const match = line.match(/^\s*(\d+)[\.\)]\s+(.*)$/);
                  const num = match ? match[1] : String(lIdx + 1);
                  const itemText = match ? match[2] : line;
                  return (
                    <li key={lIdx} className="flex items-start gap-2 text-xs">
                      <span className="px-1.5 py-0.2 bg-[#1C2533] border border-[#C5A880]/50 text-[#C5A880] text-[9px] font-mono font-bold rounded flex-shrink-0 mt-0.5">
                        {num}
                      </span>
                      <span className="flex-1">{renderFormattedText(itemText)}</span>
                    </li>
                  );
                })}
            </ol>
          );
        }

        // Regular paragraph with mixed lines
        return (
          <p key={pIdx} className="text-xs">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderFormattedText(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses bold text (**text**), inline code (`code`), and currency/hours highlights
 */
function renderFormattedText(text: string) {
  // Regex to match **bold** and `code`
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-white text-[#C5A880]/90">
          {boldText}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 bg-[#0D1117] border border-[#2D3748] rounded text-[#C5A880] font-mono text-[10px] mx-0.5"
        >
          {codeText}
        </code>
      );
    }
    return part;
  });
}
