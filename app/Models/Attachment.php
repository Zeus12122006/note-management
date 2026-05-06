<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attachment extends Model
{
    use HasUuids, SoftDeletes;
    
    protected $fillable = ['id', 'note_id', 'path', 'type'];

    public function note() {
        return $this->belongsTo(Note::class);
    }
}
