<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'message',
        'bien_id',
        'paiement_id',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function paiement()
    {
        return $this->belongsTo(Paiement::class);
    }
}
