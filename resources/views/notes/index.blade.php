<x-app-layout>
    <div class="h-screen flex flex-col bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm p-4 md:p-6">
            <h1 class="text-3xl font-bold">📝 Ghi chú</h1>
        </div>

        <!-- Main Content: 60/40 Layout -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Left: Tạo ghi chú (60%) - FIXED -->
            <div class="w-3/5 bg-white border-r border-gray-200 overflow-y-auto p-6">
                <!-- Form Tạo ghi chú -->
                <div class="p-6 bg-white shadow-md rounded-lg border-2 border-blue-100">
                    <h2 class="text-sm font-semibold text-blue-500 mb-3 uppercase">✏️ Tạo ghi chú</h2>
                    <input type="hidden" id="noteId" value="">
                    <input type="text" id="noteTitle" placeholder="Tiêu đề..." class="w-full border-none focus:ring-0 text-xl font-bold p-0 mb-2">
                    <textarea id="noteContent" placeholder="Nội dung..." class="w-full border-none focus:ring-0 p-0 text-gray-700" rows="6"></textarea>

                    <div class="mt-3 flex items-center gap-3">
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Màu:</label>
                            <input type="color" id="noteColor" value="#fff9e6" class="h-12 w-12 rounded cursor-pointer border-2 border-gray-200">
                        </div>
                        <div class="flex-1">
                            <label class="text-xs text-gray-600 block mb-1">📎 Ảnh:</label>
                            <input type="file" id="attachmentInput" accept="image/*" class="w-full text-xs">
                        </div>
                    </div>

                    <div id="attachmentsContainer" class="mt-3 hidden">
                        <label class="text-xs text-gray-600 block mb-2">Hình đã tải:</label>
                        <div id="attachmentsList" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3"></div>
                    </div>

                    <div class="mt-4">
                        <label class="text-xs text-gray-600 block mb-2">🏷️ Nhãn (cách nhau bằng dấu phẩy):</label>
                        <input type="text" id="labelInput" placeholder="Ví dụ: công việc, quan trọng, cần làm" class="w-full px-3 py-2 border rounded-lg text-xs">
                    </div>

                    <div class="flex justify-between items-center mt-4 pt-3 border-t">
                        <div id="saveStatus" class="text-xs text-gray-400">Chờ nhập...</div>
                        <div class="flex gap-2 items-center">
                            <label class="text-xs flex items-center gap-1">
                                <input type="checkbox" id="autoSaveToggle" class="w-4 h-4">
                                <span>Auto</span>
                            </label>
                            <button onclick="manualSave()" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">💾 Lưu</button>
                            <button onclick="newNote()" title="Ghi chú mới" class="bg-green-500 text-white px-3 py-1 rounded text-xs">➕ Mới</button>
                            <button onclick="togglePassword()" title="Khóa ghi chú" class="text-sm px-2 py-1">🔒</button>
                            <button onclick="togglePin()" title="Ghim ghi chú" class="text-sm px-2 py-1">📌</button>
                            <button onclick="openShareModal()" title="Chia sẻ ghi chú" class="text-sm px-2 py-1">👥</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Danh sách ghi chú (40%) - SCROLLABLE -->
            <div class="w-2/5 bg-gray-50 border-l border-gray-200 overflow-y-auto p-6">
                <!-- Search -->
                <div class="mb-4 sticky top-0 bg-gray-50 pb-4">
                    <input type="text" id="searchBox" placeholder="🔍 Tìm tiêu đề..." class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Notes List -->
                <div class="space-y-3">
                    <h3 class="text-lg font-semibold mb-4">📋 Ghi chú</h3>
                    <div id="notesContainer" class="space-y-3">
                        @foreach($notes as $note)
                            <div id="note-card-{{ $note->id }}" class="border-2 p-4 rounded-lg shadow hover:shadow-lg group cursor-pointer" 
                                style="background-color: {{ $note->color ?? '#fff9e6' }}">
                                <div class="flex gap-1 text-lg mb-2">
                                    @if($note->is_pinned) 📌 @endif
                                    @if($note->password) 🔒 @endif
                                    @if($note->sharedWith && $note->sharedWith->count() > 0) 👥 @endif
                                </div>
                                <div onclick="editNote({{ json_encode($note) }})" class="cursor-pointer">
                                    <h2 class="font-bold text-sm">{{ $note->title ?: '(Không tiêu đề)' }}</h2>
                                    <p class="text-xs mt-1 line-clamp-2">{{ Str::limit($note->content, 80) }}</p>
                                </div>
                                @if($note->labels && $note->labels->count() > 0)
                                    <div class="flex flex-wrap gap-1 mt-2">
                                        @foreach($note->labels as $l)
                                            <span class="text-xs bg-blue-200 px-2 py-0.5 rounded">#{{ $l->name }}</span>
                                        @endforeach
                                    </div>
                                @endif
                                <div class="flex justify-between items-center mt-2 pt-2 border-t text-xs text-gray-600">
                                    <span>{{ $note->updated_at->diffForHumans() }}</span>
                                    <div class="flex gap-2">
                                        <button onclick="editNote({{ json_encode($note) }})" class="text-blue-500 hover:text-blue-700">✏️</button>
                                        <form action="{{ route('notes.destroy', $note->id) }}" method="POST" class="inline" onsubmit="return confirm('Xóa?')">
                                            @csrf @method('DELETE')
                                            <button type="submit" class="text-red-500 hover:text-red-700">🗑️</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>

                <!-- Shared Notes -->
                @if(count($sharedNotes ?? []) > 0)
                    <div class="mt-8 pt-6 border-t">
                        <h3 class="text-lg font-semibold mb-4">👥 Chia sẻ</h3>
                        <div class="space-y-3">
                            @foreach($sharedNotes as $s)
                                <div class="border-2 border-yellow-400 p-4 rounded-lg bg-yellow-50">
                                    <div class="text-xs text-gray-600 mb-2">📤 {{ $s->sharedBy->name }}</div>
                                    <h3 class="font-bold text-sm">{{ $s->note->title }}</h3>
                                    <span class="text-xs bg-blue-100 px-2 py-1 rounded">
                                        {{ $s->permission === 'edit' ? '✏️ Sửa' : '👁️ Xem' }}
                                    </span>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div id="passwordModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h3 class="text-lg font-bold mb-4">🔒 Khóa ghi chú</h3>
            <input type="password" id="passwordInput" placeholder="Mật khẩu" class="w-full px-3 py-2 border rounded mb-2">
            <input type="password" id="passwordConfirm" placeholder="Xác nhận" class="w-full px-3 py-2 border rounded mb-4">
            <div class="flex justify-end gap-2">
                <button onclick="closePasswordModal()" class="px-4 py-2 bg-gray-300 rounded">Hủy</button>
                <button onclick="setPassword()" class="px-4 py-2 bg-blue-500 text-white rounded">Khóa</button>
            </div>
        </div>
    </div>

    <div id="shareModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h3 class="text-lg font-bold mb-4">👥 Chia sẻ</h3>
            <input type="email" id="shareEmail" placeholder="Email" class="w-full px-3 py-2 border rounded mb-2">
            <select id="sharePermission" class="w-full px-3 py-2 border rounded mb-4">
                <option value="read">👁️ Chỉ xem</option>
                <option value="edit">✏️ Có sửa</option>
            </select>
            <div class="flex justify-end gap-2">
                <button onclick="closeShareModal()" class="px-4 py-2 bg-gray-300 rounded">Hủy</button>
                <button onclick="shareNoteSubmit()" class="px-4 py-2 bg-green-500 text-white rounded">Chia sẻ</button>
            </div>
        </div>
    </div>
</x-app-layout>

<script>
    let currentNote = null, timeout;
    let autoSaveEnabled = false;

    document.addEventListener('DOMContentLoaded', () => {
        loadLabels();
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        autoSaveToggle?.addEventListener('change', () => {
            autoSaveEnabled = autoSaveToggle.checked;
            document.getElementById('saveStatus').innerText = autoSaveEnabled ? '⚙️ Auto-save: BẬT' : '⚙️ Auto-save: TẮT';
        });
        
        ['noteTitle', 'noteContent', 'noteColor'].forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('change', () => { if (autoSaveEnabled) { clearTimeout(timeout); timeout = setTimeout(autoSave, 30000); } });
            el?.addEventListener('keyup', () => { if (autoSaveEnabled) { clearTimeout(timeout); timeout = setTimeout(autoSave, 30000); } });
        });

        document.getElementById('searchBox').addEventListener('keyup', function() {
            const q = this.value.toLowerCase();
            document.querySelectorAll('#notesContainer > div').forEach(c => {
                const t = c.querySelector('h2')?.textContent.toLowerCase() || '';
                c.style.display = t.includes(q) ? '' : 'none';
            });
        });
    });

    function editNote(note) {
        currentNote = note;
        document.getElementById('noteId').value = note.id || '';
        document.getElementById('noteTitle').value = note.title || '';
        document.getElementById('noteContent').value = note.content || '';
        document.getElementById('noteColor').value = note.color || '#fff9e6';
        document.getElementById('saveStatus').innerText = "Chỉnh sửa...";
        loadAttachments(note.id);
        
        // Load nhãn của ghi chú
        if (note.labels && note.labels.length > 0) {
            const labelNames = note.labels.map(l => l.name).join(', ');
            document.getElementById('labelInput').value = labelNames;
        } else {
            document.getElementById('labelInput').value = '';
        }
    }

    function loadAttachments(noteId) {
        if (!noteId) {
            document.getElementById('attachmentsContainer').classList.add('hidden');
            return;
        }
        fetch(`/notes/${noteId}/attachments`)
            .then(r => r.json())
            .then(attachments => {
                const list = document.getElementById('attachmentsList');
                list.innerHTML = '';
                if (attachments.length === 0) {
                    document.getElementById('attachmentsContainer').classList.add('hidden');
                    return;
                }
                document.getElementById('attachmentsContainer').classList.remove('hidden');
                attachments.forEach(att => {
                    const div = document.createElement('div');
                    div.className = 'relative group h-28 w-28';
                    div.innerHTML = `
                        <img src="${att.path}" alt="Hình" class="w-full h-full object-contain rounded border-2 border-gray-300">
                        <button onclick="deleteAttachmentDirect(${att.id}, ${noteId})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs">✕</button>
                    `;
                    list.appendChild(div);
                });
            })
            .catch(() => document.getElementById('attachmentsContainer').classList.add('hidden'));
    }

    function autoSave() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        
        if (!title || !content) {
            document.getElementById('saveStatus').innerText = '⚠️ Cần tiêu đề + nội dung';
            return;
        }
        
        const id = document.getElementById('noteId').value.trim();
        const color = document.getElementById('noteColor').value;
        const label_names = document.getElementById('labelInput').value.split(',').map(l => l.trim()).filter(l => l);

        document.getElementById('saveStatus').innerText = "Lưu...";

        fetch("{{ route('notes.store') }}", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "{{ csrf_token() }}" },
            body: JSON.stringify({ id: id || null, title: title || 'Không tiêu đề', content, color, label_names })
        })
        .then(r => r.json())
        .then(d => {
            document.getElementById('saveStatus').innerText = "✅ Lưu lúc " + new Date().toLocaleTimeString();
            if (!id) {
                document.getElementById('noteId').value = d.id;
                setTimeout(() => location.reload(), 700);
            }
        })
        .catch(() => { document.getElementById('saveStatus').innerText = "❌ Lỗi!"; });
    }

    function manualSave() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        
        if (!title || !content) {
            alert('⚠️ Vui lòng nhập tiêu đề và nội dung');
            return;
        }
        
        const id = document.getElementById('noteId').value.trim();
        const color = document.getElementById('noteColor').value;
        const label_names = document.getElementById('labelInput').value.split(',').map(l => l.trim()).filter(l => l);
        const isNewNote = !id;
        
        document.getElementById('saveStatus').innerText = "Lưu...";
        
        fetch("{{ route('notes.store') }}", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "{{ csrf_token() }}" },
            body: JSON.stringify({ id: id || null, title, content, color, label_names })
        })
        .then(r => r.json())
        .then(d => {
            document.getElementById('saveStatus').innerText = "✅ Lưu lúc " + new Date().toLocaleTimeString();
            if (isNewNote) {
                document.getElementById('noteId').value = d.id;
                alert('✅ Tạo ghi chú thành công');
                setTimeout(() => {
                    newNote();
                    location.reload();
                }, 700);
            } else {
                alert('✅ Cập nhật thành công');
                setTimeout(() => {
                    newNote();
                    location.reload();
                }, 700);
            }
        })
        .catch(() => { document.getElementById('saveStatus').innerText = "❌ Lỗi!"; });
    }

    function newNote() {
        document.getElementById('noteId').value = '';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteColor').value = '#fff9e6';
        document.getElementById('attachmentInput').value = '';
        document.getElementById('attachmentsContainer').classList.add('hidden');
        document.getElementById('labelInput').value = '';
        document.getElementById('saveStatus').innerText = "Chờ nhập...";
        currentNote = null;
    }

    function loadLabels() {
        fetch("{{ route('labels.index') }}")
            .then(r => r.json())
            .then(ls => {
                const c = document.getElementById('labelsContainer');
                const sel = document.getElementById('labelSelect');
                c.innerHTML = '';
                sel.innerHTML = '<option value="">-- Chọn nhãn --</option>';
                ls.forEach(l => {
                    const b = document.createElement('button');
                    b.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200';
                    b.textContent = '#' + l.name;
                    b.type = 'button';
                    b.onclick = (e) => { e.preventDefault(); };
                    c.appendChild(b);
                    
                    const opt = document.createElement('option');
                    opt.value = l.id;
                    opt.textContent = l.name;
                    sel.appendChild(opt);
                });
            });
    }

    function togglePin() {
        if (!currentNote?.id) return alert('Tạo ghi chú trước');
        fetch(`/notes/${currentNote.id}/pin`, { method: "PATCH", headers: { "X-CSRF-TOKEN": "{{ csrf_token() }}" } })
            .then(r => r.json())
            .then(() => { alert('✅ Ghim thành công'); location.reload(); })
            .catch(() => alert('❌ Lỗi'));
    }

    function togglePassword() {
        if (!currentNote?.id) return alert('Tạo ghi chú trước');
        document.getElementById('passwordModal').classList.remove('hidden');
    }

    function closePasswordModal() {
        document.getElementById('passwordModal').classList.add('hidden');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordConfirm').value = '';
    }

    function setPassword() {
        const p = document.getElementById('passwordInput').value;
        const c = document.getElementById('passwordConfirm').value;
        if (!p || p !== c || p.length < 4) return alert('Kiểm tra mật khẩu');

        fetch(`/notes/${currentNote.id}/password`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "{{ csrf_token() }}" },
            body: JSON.stringify({ password: p, password_confirmation: c })
        })
        .then(r => r.json())
        .then(d => {
            if (d.success) { closePasswordModal(); alert('✅ Khóa thành công'); location.reload(); }
            else alert('❌ ' + d.error);
        })
        .catch(() => alert('❌ Lỗi'));
    }

    function openShareModal() {
        if (!currentNote?.id) return alert('Tạo ghi chú trước');
        document.getElementById('shareModal').classList.remove('hidden');
    }

    function closeShareModal() {
        document.getElementById('shareModal').classList.add('hidden');
        document.getElementById('shareEmail').value = '';
    }

    function shareNoteSubmit() {
        const e = document.getElementById('shareEmail').value.trim();
        const p = document.getElementById('sharePermission').value;
        if (!e) return alert('Nhập email');

        fetch(`/notes/${currentNote.id}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "{{ csrf_token() }}" },
            body: JSON.stringify({ email: e, permission: p })
        })
        .then(r => r.json())
        .then(d => {
            if (d.error) alert('❌ ' + d.error);
            else { closeShareModal(); alert('✅ Chia sẻ thành công'); location.reload(); }
        })
        .catch(() => alert('❌ Lỗi'));
    }

    document.getElementById('attachmentInput')?.addEventListener('change', function() {
        let noteId = document.getElementById('noteId').value.trim();
        
        if (!noteId) {
            const title = document.getElementById('noteTitle').value.trim() || 'Ghi chú mới';
            const content = document.getElementById('noteContent').value.trim() || ' ';
            const color = document.getElementById('noteColor').value;
            const label_names = document.getElementById('labelInput').value.split(',').map(l => l.trim()).filter(l => l);
            
            document.getElementById('saveStatus').innerText = "Tạo draft...";
            
            fetch("{{ route('notes.store') }}", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "{{ csrf_token() }}" },
                body: JSON.stringify({ id: null, title, content, color, label_names })
            })
            .then(r => r.json())
            .then(d => {
                currentNote = d;
                document.getElementById('noteId').value = d.id;
                uploadFile(this.files[0], d.id);
            })
            .catch(err => { console.error('Lỗi tạo draft:', err); this.value = ''; });
            return;
        }
        
        uploadFile(this.files[0], noteId);
    });

    function uploadFile(file, noteId) {
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        fetch(`/notes/${noteId}/attachments`, {
            method: "POST",
            headers: { "X-CSRF-TOKEN": "{{ csrf_token() }}" },
            body: fd
        })
        .then(r => r.json())
        .then(() => { 
            document.getElementById('attachmentInput').value = ''; 
            loadAttachments(noteId);
        })
        .catch(() => alert('❌ Lỗi upload'));
    }

    function deleteAttachmentDirect(attachmentId, noteId) {
        if (!confirm('Xóa hình này?')) return;
        fetch(`/notes/attachments/${attachmentId}`, {
            method: "DELETE",
            headers: { "X-CSRF-TOKEN": "{{ csrf_token() }}" }
        })
        .then(r => r.json())
        .then(() => {
            loadAttachments(noteId);
        })
        .catch(() => alert('❌ Lỗi xóa'));
    }
</script>
