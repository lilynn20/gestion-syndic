<?php

namespace App\Exports;

use App\Models\Frais;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FraisExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    public function collection()
    {
        return Frais::with(['bien', 'paiement'])
            ->orderByDesc('date_frais')
            ->get();
    }

    public function map($frais): array
    {
        return [
            $frais->id,
            $frais->description,
            $frais->montant,
            optional($frais->date_frais)->format('Y-m-d'),
            $frais->paye ? 'Oui' : 'Non',
            $frais->is_global ? 'Oui' : 'Non',
            $frais->bien_id,
            $frais->paiement_id,
        ];
    }

    public function headings(): array
    {
        return [
            'ID',
            'Description',
            'Montant',
            'Date',
            'Payé',
            'Global',
            'Bien ID',
            'Paiement ID',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Bold header row
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
