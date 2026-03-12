<?php

namespace App\Exports;

use App\Models\Depense;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DepensesExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    public function collection()
    {
        return Depense::orderByDesc('date_depense')->get();
    }

    public function map($depense): array
    {
        return [
            $depense->id,
            $depense->description,
            $depense->categorie,
            $depense->montant,
            optional($depense->date_depense)->format('Y-m-d'),
        ];
    }

    public function headings(): array
    {
        return [
            'ID',
            'Description',
            'Catégorie',
            'Montant',
            'Date',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
