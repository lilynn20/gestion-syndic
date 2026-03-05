<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Frais extends Model
{
    use HasFactory;

    protected $table = 'frais';

    protected $fillable = [
        'bien_id',
        'paiement_id',
        'description',
        'montant',
        'date_frais',
        'paye',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_frais' => 'date',
        'paye' => 'boolean',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class);
    }
}
