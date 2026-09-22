import React from "react";

interface CollegeDescriptionProps {
  description?: string | null;
}

/**
 * Splits raw college description text into paragraph blocks at numbered points
 * (e.g., "1.", "2.", "3.") or line breaks, preserving exact text content.
 */
function getParagraphs(description?: string | null): string[] {
  if (!description || !description.trim()) {
    return [];
  }

  const trimmed = description.trim();

  // Add paragraph break before numbered points like " 2. ", " 3. " if concatenated inline
  const normalized = trimmed.replace(/\s+(\d+[\.\)]\s+)/g, "\n\n$1");

  // Split by double newlines or single newlines
  return normalized
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

const CollegeDescription: React.FC<CollegeDescriptionProps> = ({ description }) => {
  const paragraphs = getParagraphs(description);

  if (paragraphs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-neutral-50/60 p-4 text-sm text-text-muted italic">
        No institution description available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-neutral-50/60 p-4 text-sm text-text-secondary leading-relaxed space-y-3">
      {paragraphs.map((para, index) => (
        <p key={index} className="whitespace-pre-line break-words">
          {para}
        </p>
      ))}
    </div>
  );
};

export default CollegeDescription;
