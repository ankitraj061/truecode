import React from 'react';
import { Topic } from './types';
import { Sparkles } from 'lucide-react';

interface TopicsBarProps {
  topics: Topic[];
  selectedTopic: string;
  onTopicSelect: (topic: string) => void;
  isLoading: boolean;
  totalProblems?: number;
}

const TopicsBar: React.FC<TopicsBarProps> = ({
  topics,
  selectedTopic,
  onTopicSelect,
  totalProblems,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-7 w-24 skeleton rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)]">
      <div className="px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
        {/* All Topics pill */}
        <button
          onClick={() => onTopicSelect('')}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
            selectedTopic === ''
              ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          All
          <span className={`text-[10px] ${selectedTopic === '' ? 'opacity-80' : 'opacity-60'}`}>
            {totalProblems}
          </span>
        </button>

        {topics.map((topic) => {
          const active = selectedTopic === topic.topic;
          return (
            <button
              key={topic.topic}
              onClick={() => onTopicSelect(active ? '' : topic.topic)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                active
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
              }`}
            >
              {topic.topic}
              <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-60'}`}>
                {topic.count}
              </span>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default TopicsBar;
