<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bien extends Model
{
    use HasFactory;

    protected $fillable = [
        'proprietaire_id',
        'type',
        'numero',
        'adresse',
        'cotisation_mensuelle',
    ];

    protected $casts = [
        'cotisation_mensuelle' => 'decimal:2',
    ];

    public function proprietaire(): BelongsTo
    {
        return $this->belongsTo(Proprietaire::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function frais(): HasMany
    {
        return $this->hasMany(Frais::class);
    }

    public function getPaiementPourMois(int $mois, int $annee): ?Paiement
    {
        return $this->paiements()
            ->where('mois', $mois)
            ->where('annee', $annee)
            ->first();
    }

    public function getStatutPaiement(int $mois, int $annee): string
    {
        $paiement = $this->getPaiementPourMois($mois, $annee);
        
        if ($paiement) {
            return 'paye';
        }

        $dateEcheance = \Carbon\Carbon::create($annee, $mois, 31);
        if ($dateEcheance->isPast()) {
            return 'en_retard';
        }

        return 'non_paye';
    }
}
