import React, { useState } from 'react';
import { StarStory } from '../../types';
import { BookOpen, Plus, Trash2, Edit3, Tag, Award, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface StoryBankProps {
  stories: StarStory[];
  onUpdateStories: (stories: StarStory[]) => void;
}

export const StoryBank: React.FC<StoryBankProps> = ({ stories, onUpdateStories }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(stories[0]?.id || null);
  const [editingStory, setEditingStory] = useState<StarStory | null>(null);

  const categories = [
    { id: 'all', label: 'All Stories' },
    { id: 'technical-challenge', label: 'Technical Challenge' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'conflict', label: 'Conflict & Resolution' },
    { id: 'failure-learning', label: 'Failure & Learning' },
    { id: 'impact-metric', label: 'High Impact / Metrics' },
  ];

  const filteredStories = stories.filter((s) =>
    selectedCategory === 'all' ? true : s.category === selectedCategory
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;

    if (stories.some((s) => s.id === editingStory.id)) {
      onUpdateStories(stories.map((s) => (s.id === editingStory.id ? editingStory : s)));
    } else {
      onUpdateStories([...stories, editingStory]);
    }
    setEditingStory(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this story?')) {
      onUpdateStories(stories.filter((s) => s.id !== id));
    }
  };

  const startNewStory = () => {
    const newStory: StarStory = {
      id: 'story-' + Date.now(),
      title: 'New Achievement Story',
      category: 'technical-challenge',
      tags: ['Problem-Solving'],
      situation: '',
      task: '',
      action: '',
      result: '',
      metrics: '',
      technologiesUsed: [],
    };
    setEditingStory(newStory);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Category Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            Behavioral STAR Story Bank ({stories.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your structured experiences. During live interviews, the AI pulls from these stories to match behavioral questions instantly.
          </p>
        </div>
        <button
          onClick={startNewStory}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-sky-500/10"
        >
          <Plus className="w-4 h-4" /> Add New Story
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedCategory === cat.id
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stories List */}
      <div className="space-y-3">
        {filteredStories.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400 mb-3">No stories found in this category.</p>
            <button
              onClick={startNewStory}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg"
            >
              Create Story
            </button>
          </div>
        ) : (
          filteredStories.map((story) => {
            const isExpanded = expandedStoryId === story.id;
            return (
              <div
                key={story.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                {/* Story Card Header */}
                <div
                  className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40"
                  onClick={() => setExpandedStoryId(isExpanded ? null : story.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {story.category}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{story.title}</h3>
                    {story.metrics && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Award className="w-3 h-3" /> {story.metrics}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStory(story);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Edit Story"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(story.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete Story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded STAR Details */}
                {isExpanded && (
                  <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                          Situation
                        </span>
                        <p className="text-slate-300 leading-relaxed">{story.situation || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                          Task
                        </span>
                        <p className="text-slate-300 leading-relaxed">{story.task || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                          Action
                        </span>
                        <p className="text-slate-300 leading-relaxed">{story.action || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          Result & Measurable Impact
                        </span>
                        <p className="text-slate-300 leading-relaxed">{story.result || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Technologies and Tags */}
                    {story.technologiesUsed && story.technologiesUsed.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-slate-500 font-medium text-[11px]">Tech:</span>
                        <div className="flex flex-wrap gap-1">
                          {story.technologiesUsed.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Create Story Modal */}
      {editingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-base font-semibold text-slate-100">
                {stories.some((s) => s.id === editingStory.id) ? 'Edit STAR Story' : 'New STAR Story'}
              </h3>
              <button
                onClick={() => setEditingStory(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Story Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStory.title}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    placeholder="e.g. Scaled Payment Gateway to 10k RPS"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editingStory.category}
                    onChange={(e) =>
                      setEditingStory({
                        ...editingStory,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                  >
                    <option value="technical-challenge">Technical Challenge</option>
                    <option value="leadership">Leadership</option>
                    <option value="conflict">Conflict & Resolution</option>
                    <option value="failure-learning">Failure & Learning</option>
                    <option value="impact-metric">High Impact / Metrics</option>
                    <option value="cross-functional">Cross-Functional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-sky-400 uppercase tracking-wider mb-1">
                  Situation (The Context & Challenge)
                </label>
                <textarea
                  rows={2}
                  value={editingStory.situation}
                  onChange={(e) => setEditingStory({ ...editingStory, situation: e.target.value })}
                  placeholder="What was the business problem, environment, or stakes?"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Task (Your Specific Responsibility)
                </label>
                <textarea
                  rows={2}
                  value={editingStory.task}
                  onChange={(e) => setEditingStory({ ...editingStory, task: e.target.value })}
                  placeholder="What were you tasked with achieving or overcoming?"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  Action (Concrete Steps You Took)
                </label>
                <textarea
                  rows={3}
                  value={editingStory.action}
                  onChange={(e) => setEditingStory({ ...editingStory, action: e.target.value })}
                  placeholder="Describe your architecture choices, technical implementation, or interpersonal mediation..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                  Result & Quantifiable Impact
                </label>
                <textarea
                  rows={2}
                  value={editingStory.result}
                  onChange={(e) => setEditingStory({ ...editingStory, result: e.target.value })}
                  placeholder="What was the measurable outcome? (e.g. 50% faster, $200k saved, 0 downtime)"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Key Metric Highlight
                  </label>
                  <input
                    type="text"
                    value={editingStory.metrics || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, metrics: e.target.value })}
                    placeholder="e.g. 68% p99 reduction"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Technologies Used (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingStory.technologiesUsed?.join(', ') || ''}
                    onChange={(e) =>
                      setEditingStory({
                        ...editingStory,
                        technologiesUsed: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Go, Kafka, Redis, Docker"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl"
                >
                  Save Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
