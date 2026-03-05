<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proprietaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
    ];

    public function biens(): HasMany
    {
        return $this->hasMany(Bien::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    public function getTotalPaiementsAttribute(): float
    {
        return $this->biens->sum(function ($bien) {
            return $bien->paiements->sum('montant');
        });
    }
}
