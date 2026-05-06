<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SharedNote extends Model
{
    use HasUuids;
    
    protected $fillable = ['note_id', 'shared_with_email', 'permission'];

    public function note() {
        return $this->belongsTo(Note::class);
    }
}
