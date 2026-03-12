<?php

namespace App\Exports;

use App\Models\Paiement;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaiementsExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    public function collection()
    {
        return Paiement::with(['bien.proprietaire'])
            ->orderByDesc('date_paiement')
            ->get();
    }

    public function map($paiement): array
    {
        return [
            $paiement->id,
            $paiement->bien ? ($paiement->bien->type === 'appartement' ? 'App' : 'Mag') . ' ' . $paiement->bien->numero : '',
            $paiement->bien && $paiement->bien->proprietaire ? $paiement->bien->proprietaire->prenom . ' ' . $paiement->bien->proprietaire->nom : '',
            $paiement->mois . '/' . $paiement->annee,
            $paiement->montant,
            optional($paiement->date_paiement)->format('Y-m-d'),
            $paiement->statut,
        ];
    }

    public function headings(): array
    {
        return [
            'ID',
            'Bien',
            'Propriétaire',
            'Période',
            'Montant',
            'Date paiement',
            'Statut',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
