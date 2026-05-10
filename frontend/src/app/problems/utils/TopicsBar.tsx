import React from 'react';
import { Topic } from './types';

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
  const getTopicIcon = (topic: string) => {
    const iconMap: { [key: string]: string } = {
      'Array': '🔢',
      'String': '📝',
      'Linked List': '🔗',
      'Binary Tree': '🌳',
      'Binary Search Tree': '🌲',
      'Graph': '🕸️',
      'Dynamic Programming': '⚡',
      'Greedy': '🎯',
      'Backtracking': '🔄',
      'Divide and Conquer': '⚔️',
      'Hash Table': '🗂️',
      'Stack': '📚',
      'Queue': '🚶',
      'Heap': '⛰️',
      'Trie': '🌐',
      'Bit Manipulation': '🔢',
      'Math': '🧮',
      'Two Pointers': '👉',
      'Sliding Window': '🪟',
      'Binary Search': '🔍',
      'Sorting': '📊',
      'Union Find': '🤝',
      'Topological Sort': '📈',
      'Recursion': '🔁',
      'Tree': '🎄',
      'Design': '🎨',
      'Database': '💾',
      'System Design': '🏗️'
    };
    return iconMap[topic] || '💡';
  };

  if (isLoading) {
    return (
      <div className="bg-elevated border-b border-primary px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-7 w-24 skeleton rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-elevated border-b border-primary">
      <div className="px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
        {/* All Topics pill */}
        <button
          onClick={() => onTopicSelect('')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
            selectedTopic === ''
              ? 'bg-brand text-inverse shadow-sm'
              : 'bg-secondary text-secondary hover:bg-brand/10 hover:text-brand border border-primary'
          }`}
        >
          <span>🌟</span>
          <span>All</span>
          <span className={`text-[10px] ${selectedTopic === '' ? 'opacity-80' : 'opacity-60'}`}>
            {totalProblems}
          </span>
        </button>

        {topics.map((topic) => (
          <button
            key={topic.topic}
            onClick={() => onTopicSelect(topic.topic === selectedTopic ? '' : topic.topic)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedTopic === topic.topic
                ? 'bg-brand text-inverse shadow-sm'
                : 'bg-secondary text-secondary hover:bg-brand/10 hover:text-brand border border-primary'
            }`}
          >
            <span>{getTopicIcon(topic.topic)}</span>
            <span>{topic.topic}</span>
            <span className={`text-[10px] ${selectedTopic === topic.topic ? 'opacity-80' : 'opacity-60'}`}>
              {topic.count}
            </span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default TopicsBar;
