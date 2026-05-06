<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('note.{id}', function ($user, $id) {
    $note = \App\Models\Note::find($id);
    if (!$note) return false;
    
    // Chủ sở hữu hoặc người được share
    return (string) $user->id === (string) $note->user_id || $note->isSharedWith($user->email);
});
