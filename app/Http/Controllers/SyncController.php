<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Note;
use App\Models\Label;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SyncController extends Controller
{
    public function sync(Request $request)
    {
        $user = $request->user();
        $changes = $request->input('changes', []);
        
        DB::beginTransaction();
        try {
            // Process incoming changes (Last Write Wins)
            foreach ($changes as $change) {
                $entityType = $change['entity']; // 'note' or 'label'
                $action = $change['action']; // 'CREATE', 'UPDATE', 'DELETE'
                $data = $change['data']; // Dữ liệu từ offline

                if ($entityType === 'note') {
                    $note = Note::withTrashed()->find($data['id']);
                    // LWW: Cập nhật nếu chưa có trên server, hoặc dữ liệu client mới hơn/bằng server
                    if (!$note || $action === 'DELETE' || Carbon::parse($data['updated_at']) >= $note->updated_at) {
                        if ($action === 'DELETE') {
                            if ($note) $note->delete();
                        } else {
                            $upsertData = [
                                'id' => $data['id'],
                                'user_id' => $user->id,
                                'title' => $data['title'] ?? '',
                                'content' => $data['content'] ?? '',
                                'is_pinned' => $data['is_pinned'] ?? false,
                                'pinned_at' => $data['pinned_at'] ?? null,
                                'version' => ($data['version'] ?? 1),
                                'created_at' => $data['created_at'] ?? Carbon::now(),
                                'updated_at' => $data['updated_at'] ?? Carbon::now(),
                            ];
                            
                            if (isset($data['lock_password'])) {
                                $upsertData['lock_password'] = $data['lock_password'];
                            }
                            
                            $newNote = Note::withTrashed()->updateOrCreate(
                                ['id' => $data['id']],
                                $upsertData
                            );
                            
                            // Restore nếu nó từng bị soft delete nhưng giờ lại được update offline
                            if ($newNote->trashed()) {
                                $newNote->restore();
                            }
                            
                            // Sync labels if they exist in the payload
                            if (isset($data['labels']) && is_array($data['labels'])) {
                                $labelIds = array_column($data['labels'], 'id');
                                $newNote->labels()->sync($labelIds);
                            }
                        }
                    }
                } elseif ($entityType === 'label') {
                    $label = Label::withTrashed()->find($data['id']);
                    if (!$label || Carbon::parse($data['updated_at']) > $label->updated_at) {
                        if ($action === 'DELETE') {
                            if ($label) $label->delete();
                        } else {
                            $newLabel = Label::withTrashed()->updateOrCreate(
                                ['id' => $data['id']],
                                [
                                    'user_id' => $user->id,
                                    'name' => $data['name'],
                                    'created_at' => $data['created_at'] ?? Carbon::now(),
                                    'updated_at' => $data['updated_at'] ?? Carbon::now()
                                ]
                            );
                            if ($newLabel->trashed()) {
                                $newLabel->restore();
                            }
                        }
                    }
                }
            }
            DB::commit();

            $myNotes = Note::with(['attachments', 'labels'])->withTrashed()->where('user_id', $user->id)->get();
            
            $sharedNoteIds = \App\Models\SharedNote::where('shared_with_email', $user->email)->pluck('note_id');
            $sharedNotes = Note::with(['user', 'attachments', 'labels'])->whereIn('id', $sharedNoteIds)->get()->map(function($n) use ($user) {
                $n->is_shared = true;
                $n->shared_by = $n->user->display_name;
                $n->shared_at = \App\Models\SharedNote::where('note_id', $n->id)->where('shared_with_email', $user->email)->value('created_at');
                $n->permission = \App\Models\SharedNote::where('note_id', $n->id)->where('shared_with_email', $user->email)->value('permission');
                return $n;
            });

            return response()->json([
                'status' => 'success',
                'notes' => $myNotes->merge($sharedNotes),
                'labels' => Label::withTrashed()->where('user_id', $user->id)->get()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sync error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
