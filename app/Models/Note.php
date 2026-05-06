<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use HasUuids, SoftDeletes;
    
    protected $fillable = ['id', 'title', 'content', 'is_pinned', 'pinned_at', 'lock_password', 'version', 'user_id'];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function labels() {
        // Quan hệ nhiều-nhiều với bảng trung gian note_label
        return $this->belongsToMany(Label::class, 'note_label');
    }

    public function attachments() {
        return $this->hasMany(Attachment::class);
    }

    public function sharedWith() {
        return $this->hasMany(SharedNote::class, 'note_id');
    }

    public function isSharedWith($email) {
        return $this->sharedWith()
            ->where('shared_with_email', $email)
            ->exists();
    }

    public function getSharedPermission($email) {
        return $this->sharedWith()
            ->where('shared_with_email', $email)
            ->value('permission');
    }
}
