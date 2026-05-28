'use client';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  'How do I use the seat swivel on a Bruno stair lift?',
  'How do I load my scooter onto the PUL-1100?',
  'What is the recommended tire pressure for the ASL-700?',
  'What does the Bruno warranty cover?',
];

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-5 pb-3">
      {SUGGESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="text-[12px] px-3 py-1.5 rounded-full border text-muted hover:text-bruno-navy transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
