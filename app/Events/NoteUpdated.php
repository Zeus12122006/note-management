<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NoteUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $note;

    public function __construct(Note $note)
    {
        $this->note = $note;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('note.' . $this->note->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->note->id,
            'title' => $this->note->title,
            'content' => $this->note->content,
            'version' => $this->note->version,
            'updated_at' => $this->note->updated_at,
        ];
    }
}
