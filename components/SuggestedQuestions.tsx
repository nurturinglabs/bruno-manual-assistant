'use client';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  'My SRE-3050 stops mid-stair and beeps once. What should I check?',
  'What is the maximum weight capacity of the SRE-2010?',
  'How do I fold down the rail on the SRE-3050?',
  'How do I operate the ASL-275 in an emergency?',
  'What maintenance does the VPL-3100 require?',
  'How do I reset the circuit breaker on a stair lift?',
  'What is the warranty period on Bruno stair lifts?',
  'What does error code C5 mean on the SRE-2010?',
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
