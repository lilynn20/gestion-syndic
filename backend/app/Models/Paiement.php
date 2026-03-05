<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'bien_id',
        'mois',
        'annee',
        'montant',
        'date_paiement',
        'date_echeance',
        'statut',
        'notes',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
        'date_echeance' => 'date',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function frais(): HasOne
    {
        return $this->hasOne(Frais::class);
    }

    public function recu(): HasOne
    {
        return $this->hasOne(Recu::class);
    }

    public function getMontantTotalAttribute(): float
    {
        $frais = $this->frais ? $this->frais->montant : 0;
        return $this->montant + $frais;
    }

    public function getMoisNomAttribute(): string
    {
        $mois = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];
        return $mois[$this->mois] ?? '';
    }
}
