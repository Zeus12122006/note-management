import React, { useState, useMemo } from 'react';
import useDebounce from '../hooks/useDebounce';
import axios from 'axios';

export default function NoteList({ notes, onSelect, onDelete, selectedNoteId, onCreateNew, isDark }) {
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const debouncedSearch = useDebounce(search, 300);

    const filteredNotes = useMemo(() => {
        if (!debouncedSearch) return notes;
        const lowerSearch = debouncedSearch.toLowerCase();
        return notes.filter(n =>
            (n.title && n.title.toLowerCase().includes(lowerSearch)) ||
            (n.content && n.content.toLowerCase().includes(lowerSearch))
        );
    }, [notes, debouncedSearch]);

    const handleDelete = (e, note) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(note.id);
    };

    const NoteCard = ({ note }) => {
        const isSelected = selectedNoteId === note.id;
        const isGrid = viewMode === 'grid';

        return (
            <div
                className={`relative group rounded-xl border flex flex-col transition-all duration-200 cursor-pointer
                    ${isGrid ? 'min-h-[120px]' : 'min-h-[72px]'}
                    ${isSelected
                        ? 'border-blue-500 bg-blue-600/5 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                        : isDark
                            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/20'
                            : 'bg-white border-gray-200 hover:border-blue-200 shadow-sm hover:shadow-md'
                    }`}
                onClick={() => onSelect(note)}
            >
                <div className={`p-3.5 flex flex-col h-full ${isGrid ? '' : 'flex-row items-center gap-3'}`}>
                    {/* Title row */}
                    <div className={`flex items-start gap-1 ${isGrid ? 'mb-1.5' : 'flex-1 min-w-0'}`}>
                        <h3 className={`font-bold text-sm flex-1 min-w-0 ${isGrid ? 'line-clamp-2' : 'line-clamp-1'} ${isSelected ? 'text-blue-500' : ''}`}>
                            {note.title || <span className="opacity-40 italic font-normal">Không tiêu đề</span>}
                        </h3>
                        {/* Status badges */}
                        <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                            {!!note.is_pinned && (
                                <svg className="w-3 h-3 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                </svg>
                            )}
                            {!!note.lock_password && (
                                <svg className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                            )}
                            {!!note.is_shared && (
                                <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Content preview — only in grid */}
                    {isGrid && (
                        <p className="text-[11px] opacity-50 line-clamp-2 flex-1 leading-relaxed">
                            {note.content || <span className="italic">Chưa có nội dung...</span>}
                        </p>
                    )}

                    {/* Labels */}
                    {isGrid && note.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {note.labels.slice(0, 2).map(l => (
                                <span key={l.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isDark ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>
                                    {l.name}
                                </span>
                            ))}
                            {note.labels.length > 2 && (
                                <span className="text-[9px] opacity-40">+{note.labels.length - 2}</span>
                            )}
                        </div>
                    )}

                    {/* Date */}
                    <div className={`text-[9px] font-bold opacity-30 uppercase tracking-tighter ${isGrid ? 'mt-2 pt-2 border-t border-current/10' : 'flex-shrink-0'}`}>
                        {new Date(note.updated_at).toLocaleDateString('vi-VN')}
                    </div>
                </div>

                {/* Delete button */}
                <button
                    type="button"
                    onClick={(e) => handleDelete(e, note)}
                    className={`
                        absolute top-2 right-2 z-20
                        w-6 h-6 rounded-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100
                        transition-all duration-150
                        hover:bg-red-500 hover:text-white scale-90 hover:scale-100
                        ${isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500'}
                        shadow
                    `}
                    title="Xóa ghi chú"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    };

    const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
    const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

    const gridClass = viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1.5';

    return (
        <div className={`flex flex-col h-full ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <div className={`p-4 border-b ${isDark ? 'border-zinc-800 bg-black' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold opacity-60 uppercase tracking-widest">
                        Ghi chú ({filteredNotes.length})
                    </h2>
                    <div className={`flex p-0.5 rounded-lg gap-0.5 ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                        <button onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? (isDark ? 'bg-zinc-700 text-white' : 'bg-white text-gray-800 shadow') : 'opacity-40 hover:opacity-70'}`}
                            title="Danh sách">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <button onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? (isDark ? 'bg-zinc-700 text-white' : 'bg-white text-gray-800 shadow') : 'opacity-40 hover:opacity-70'}`}
                            title="Lưới">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm kiếm ghi chú..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all
                            ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-blue-500 placeholder-zinc-600'
                                     : 'bg-gray-50 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder-gray-400'}`}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Note Grid/List */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {/* New note button */}
                <button
                    onClick={onCreateNew}
                    className={`w-full mb-3 p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all
                        hover:border-blue-500 hover:bg-blue-500/5 active:scale-[0.98]
                        ${isDark ? 'border-zinc-800 text-zinc-500 hover:text-blue-400' : 'border-gray-200 text-gray-400 hover:text-blue-500'}`}
                >
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold leading-none">+</div>
                    <span className="text-xs font-bold">Tạo ghi chú mới</span>
                </button>

                {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        {search ? (
                            <>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                                    <svg className="w-7 h-7 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold opacity-40">Không tìm thấy kết quả</p>
                                <p className="text-xs opacity-30 mt-1">"{search}"</p>
                            </>
                        ) : (
                            <>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                                    <svg className="w-7 h-7 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold opacity-40">Chưa có ghi chú nào</p>
                                <p className="text-xs opacity-30 mt-1">Nhấn + để tạo ghi chú mới</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pinnedNotes.length > 0 && (
                            <div>
                                <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 px-1 ${isDark ? 'text-orange-500/70' : 'text-orange-500'}`}>
                                    📌 Đã ghim
                                </p>
                                <div className={gridClass}>
                                    {pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                                </div>
                            </div>
                        )}
                        {unpinnedNotes.length > 0 && (
                            <div>
                                {pinnedNotes.length > 0 && (
                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 px-1 mt-4 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                                        Tất cả ghi chú
                                    </p>
                                )}
                                <div className={gridClass}>
                                    {unpinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
