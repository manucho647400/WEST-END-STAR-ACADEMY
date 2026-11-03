import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Bell, 
  AlertCircle, 
  PlusCircle, 
  Calendar, 
  User, 
  Trash2, 
  Tag, 
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Notice } from '../types';

export const NoticesModule: React.FC = () => {
  const { notices, addNotice, deleteNotice } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General Notice');
  const [priority, setPriority] = useState<'Urgent' | 'High' | 'Normal'>('Normal');
  const [targetAudience, setTargetAudience] = useState('All School');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  const categories = ['All', 'MOE / KNEC Directives', 'General Notice', 'Bursary & Fees', 'Co-Curricular'];

  const filteredNotices = notices.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addNotice({
      title: title.trim(),
      category,
      priority,
      targetAudience: targetAudience.trim(),
      author: author.trim(),
      content: content.trim(),
      date: new Date().toISOString().split('T')[0]
    });

    setIsAddOpen(false);
    setTitle('');
    setContent('');
    setAuthor('');
  };

  const getPriorityBadge = (p: 'Urgent' | 'High' | 'Normal') => {
    switch (p) {
      case 'Urgent':
        return <span className="font-semibold text-rose-800">Urgent</span>;
      case 'High':
        return <span className="font-semibold text-amber-800">High</span>;
      case 'Normal':
        return <span className="font-semibold text-slate-700">Normal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            KNEC & Ministry Circulars
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official assessment schedules, portal upload deadlines, and institutional circulars
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Circular</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search circulars by title, author, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter notices by category"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {filteredNotices.map(notice => (
          <div
            key={notice.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800">{notice.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{notice.targetAudience}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{notice.date}</span>
                </div>

                <h2 className="text-base font-display font-bold text-slate-900 leading-snug">
                  {notice.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs">
                {getPriorityBadge(notice.priority)}
                <button
                  onClick={() => deleteNotice(notice.id)}
                  title="Remove Notice"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {notice.content}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Issued by: {notice.author}</span>
              <span className="text-[11px] text-slate-400">West End Star Academy Gazette</span>
            </div>
          </div>
        ))}

        {filteredNotices.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">No Circulars Published</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Post your first KNEC assessment directive, fee schedule, or general institutional circular.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish First Circular</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Circular Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Publish Institutional Notice</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateNotice} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Headline</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. KNEC SBA Portal Clearance Circular"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="MOE / KNEC Directives">MOE / KNEC Directives</option>
                    <option value="General Notice">General Notice</option>
                    <option value="Bursary & Fees">Bursary & Fees</option>
                    <option value="Co-Curricular">Co-Curricular</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. JSS Cohorts (Grades 7-9)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issuing Authority / Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Office of the Headteacher"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Announcement Body</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detail the circular contents, requirements, and compliance deadlines..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
