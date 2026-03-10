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
        'scope',
        'bien_ids',
        'bien_id',
        'paiement_id',
        'description',
        'montant',
        'date_frais',
        'paye',
        'is_global',
        'paid_by_biens',
    ];

    protected $casts = [
        'bien_ids' => 'array',
        'montant' => 'decimal:2',
        'date_frais' => 'date',
        'paye' => 'boolean',
        'is_global' => 'boolean',
        'paid_by_biens' => 'array',
    ];

    /**
     * Get the share amount for a global frais based on total number of biens
     */
    public function getShareAmountAttribute(): float
    {
        if (!$this->is_global) {
            return $this->montant;
        }
        
        $totalBiens = \App\Models\Bien::count();
        if ($totalBiens === 0) {
            return 0;
        }
        
        return round($this->montant / $totalBiens, 2);
    }

    /**
     * Check if a specific bien has paid their share of this global frais
     */
    public function hasBienPaid(int $bienId): bool
    {
        if (!$this->is_global) {
            return $this->paye;
        }
        
        $paidBiens = $this->paid_by_biens ?? [];
        return in_array($bienId, $paidBiens);
    }

    /**
     * Mark a bien as having paid their share
     */
    public function markBienAsPaid(int $bienId): void
    {
        $paidBiens = $this->paid_by_biens ?? [];
        if (!in_array($bienId, $paidBiens)) {
            $paidBiens[] = $bienId;
            $this->paid_by_biens = $paidBiens;
            $this->save();
        }

        if ($this->is_global) {
            $totalBiens = \App\Models\Bien::count();
            if (count($paidBiens) >= $totalBiens) {
                $this->paye = true;
                $this->save();
            }
        } elseif (!empty($this->bien_ids)) {
            if (count($paidBiens) >= count($this->bien_ids)) {
                $this->paye = true;
                $this->save();
            }
        } else {
            // Single scope: mark as paid immediately
            $this->paye = true;
            $this->save();
        }
    }

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class);
    }
}
