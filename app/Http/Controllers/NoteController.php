<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Label;
use App\Models\Attachment;
use App\Models\SharedNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Lấy ghi chú của mình và ghi chú được share
        $myNotes = Note::with(['attachments', 'labels', 'sharedWith'])->where('user_id', $user->id)
                ->orderBy('is_pinned', 'desc')
                ->orderBy('pinned_at', 'desc')
                ->orderBy('updated_at', 'desc')
                ->get()
                ->map(function ($note) {
                    $note->is_shared = $note->sharedWith->count() > 0;
                    $note->shared_with = $note->sharedWith->map(fn($s) => ['email' => $s->shared_with_email])->values();
                    return $note;
                });

        $sharedNoteIds = SharedNote::where('shared_with_email', $user->email)->pluck('note_id');
        $sharedNotes = Note::with(['attachments', 'labels'])->whereIn('id', $sharedNoteIds)->get();

        $labels = Label::where('user_id', $user->id)->get();

        return response()->json([
            'status' => 'success',
            'notes' => $myNotes,
            'shared_notes' => $sharedNotes,
            'labels' => $labels
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required|uuid', // Phải có UUID từ frontend để phục vụ auto-save/offline
            'title' => 'nullable|string',
            'content' => 'nullable|string',
        ]);

        $user = $request->user();
        $note = Note::find($request->id);

        if ($note && $note->user_id !== $user->id) {
            // Kiểm tra xem có quyền edit do share không
            $hasEditPermission = SharedNote::where('note_id', $note->id)
                ->where('shared_with_email', $user->email)
                ->where('permission', 'edit')
                ->exists();

            if (!$hasEditPermission) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        // Auto-save logic: Dùng updateOrCreate với UUID
        $note = Note::updateOrCreate(
            ['id' => $request->id],
            [
                'user_id' => $note ? $note->user_id : $user->id,
                'title' => $request->title ?? '',
                'content' => $request->content ?? '',
                'version' => $note ? $note->version + 1 : 1,
            ]
        );

        // Broadcast Real-time (WebSocket)
        broadcast(new \App\Events\NoteUpdated($note))->toOthers();

        return response()->json([
            'status' => 'success',
            'note' => $note
        ]);
    }

    public function update(Request $request, Note $note)
    {
        return $this->store($request);
    }

    public function togglePin(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $isPinned = !$note->is_pinned;
        $note->update([
            'is_pinned' => $isPinned,
            'pinned_at' => $isPinned ? Carbon::now() : null
        ]);

        return response()->json(['status' => 'success', 'note' => $note]);
    }

    // Yêu cầu: Nhập 2 lần mật khẩu khi tạo
    public function setPassword(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'password' => 'required|string|min:4|confirmed'
        ]);

        $note->update(['lock_password' => Hash::make($request->password)]);
        return response()->json(['status' => 'success']);
    }


    // Yêu cầu: Nhập mật khẩu cũ khi xóa/thay đổi mật khẩu
    public function removePassword(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate(['old_password' => 'required|string']);

        if (!Hash::check($request->old_password, $note->lock_password)) {
            return response()->json(['error' => 'Mật khẩu cũ không đúng'], 401);
        }

        $note->update(['lock_password' => null]);
        return response()->json(['status' => 'success']);
    }

    // Chia sẻ qua email
    public function share(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'email' => 'required|email',
            'permission' => 'sometimes|in:read,edit'
        ]);

        $permission = $request->permission ?? 'read';

        if ($request->email === $request->user()->email) {
            return response()->json(['error' => 'Không thể chia sẻ với chính mình'], 422);
        }

        SharedNote::updateOrCreate(
            ['note_id' => $note->id, 'shared_with_email' => $request->email],
            ['permission' => $permission]
        );

        $sharedWith = SharedNote::where('note_id', $note->id)
            ->get()
            ->map(fn($s) => ['email' => $s->shared_with_email])
            ->values();

        return response()->json(['status' => 'success', 'shared_with' => $sharedWith]);
    }

    public function revokeShare(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate(['email' => 'required|email']);

        SharedNote::where('note_id', $note->id)
            ->where('shared_with_email', $request->email)
            ->delete();

        return response()->json(['status' => 'success']);
    }

    /**
     * Khóa ghi chú - Yêu cầu nhập 2 lần (confirmed)
     */
    public function lock(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'password' => 'required|string|min:4|confirmed',
        ]);

        $note->update([
            'lock_password' => Hash::make($request->password)
        ]);

        return response()->json(['status' => 'success', 'message' => 'Note locked successfully']);
    }

    /**
     * Đổi mật khẩu ghi chú - Yêu cầu mật khẩu cũ + mật khẩu mới 2 lần
     */
    public function updateLockPassword(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:4|confirmed',
        ]);

        if (!Hash::check($request->current_password, $note->lock_password)) {
            return response()->json(['error' => 'Mật khẩu hiện tại không chính xác'], 403);
        }

        $note->update([
            'lock_password' => Hash::make($request->new_password)
        ]);

        return response()->json(['status' => 'success', 'message' => 'Password updated successfully']);
    }

    /**
     * Tắt bảo mật hoặc Kiểm tra mật khẩu để mở khóa tạm thời
     */
    public function unlock(Request $request, Note $note)
    {
        $request->validate([
            'password' => 'required',
        ]);

        if (!Hash::check($request->password, $note->lock_password)) {
            return response()->json(['error' => 'Mật khẩu không chính xác'], 401);
        }

        // Nếu là yêu cầu GỠ BỎ hoàn toàn:
        if ($request->has('disable') && $request->disable) {
            if ($note->user_id !== $request->user()->id) {
                return response()->json(['error' => 'Chỉ chủ sở hữu mới có thể gỡ khóa'], 403);
            }
            $note->update(['lock_password' => null]);
            return response()->json(['status' => 'success', 'message' => 'Note protection disabled']);
        }

        return response()->json(['status' => 'success', 'message' => 'Unlocked', 'can_access' => true]);
    }

    // Xóa ghi chú (Soft Delete)
    public function destroy(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Bỏ kiểm tra mật khẩu theo yêu cầu của người dùng để thao tác xóa được diễn ra tức thì
        $note->delete(); // Soft delete để offline sync còn bắt được
        return response()->json(['status' => 'success']);
    }

    /**
     * Thêm ảnh đính kèm
     */
    public function storeAttachment(Request $request, Note $note)
    {
        $request->validate(['image' => 'required|image|max:5120']);
        
        $path = $request->file('image')->store('attachments', 'public');
        
        $attachment = $note->attachments()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'path' => $path,
            'type' => 'image'
        ]);
        
        return response()->json(['status' => 'success', 'attachment' => $attachment]);
    }

    /**
     * Xóa ảnh đính kèm
     */
    public function deleteAttachment(Request $request, Attachment $attachment)
    {
        // Kiểm tra quyền (chủ sở hữu ghi chú hoặc người có quyền edit)
        $note = $attachment->note;
        if ($note->user_id !== $request->user()->id && !$note->isSharedWith($request->user()->email)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $attachment->delete();
        return response()->json(['status' => 'success']);
    }

    /**
     * Gắn hoặc bỏ gắn nhãn cho ghi chú
     */
    public function toggleLabel(Request $request, Note $note)
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'label_id' => 'required|uuid'
        ]);

        $note->labels()->toggle($request->label_id);
        
        return response()->json(['status' => 'success', 'labels' => $note->labels]);
    }
}
