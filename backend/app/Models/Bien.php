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
        'date_adhesion',
    ];

    protected $casts = [
        'cotisation_mensuelle' => 'decimal:2',
        'date_adhesion' => 'date',
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
        // Si le bien a une date d'adhésion, vérifier si le mois est avant cette date
        if ($this->date_adhesion) {
            $dateAdhesion = \Carbon\Carbon::parse($this->date_adhesion);
            $dateMois = \Carbon\Carbon::create($annee, $mois, 1);
            
            // Si le mois est avant la date d'adhésion, pas de paiement requis
            if ($dateMois->lt($dateAdhesion->startOfMonth())) {
                return 'non_applicable';
            }
        }

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
