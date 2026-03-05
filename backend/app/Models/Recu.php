<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recu extends Model
{
    use HasFactory;

    protected $fillable = [
        'paiement_id',
        'numero_recu',
        'date_emission',
        'montant_total',
    ];

    protected $casts = [
        'date_emission' => 'date',
        'montant_total' => 'decimal:2',
    ];

    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class);
    }

    public static function generateNumero(): string
    {
        $prefix = 'REC-' . date('Y') . '-';
        $lastRecu = self::where('numero_recu', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastRecu) {
            $lastNumber = intval(substr($lastRecu->numero_recu, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
