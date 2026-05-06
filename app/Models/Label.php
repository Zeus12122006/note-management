<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class Label extends Model
{
    use HasUuids, SoftDeletes;
    
    protected $fillable = ['id', 'name', 'user_id'];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function notes() {
        return $this->belongsToMany(Note::class, 'note_label');
    }
}
