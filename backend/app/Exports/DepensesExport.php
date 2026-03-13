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
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = Depense::query();
        if (!empty($this->filters['categorie'])) {
            $query->where('categorie', $this->filters['categorie']);
        }
        if (!empty($this->filters['date_debut']) && !empty($this->filters['date_fin'])) {
            $query->whereBetween('date_depense', [$this->filters['date_debut'], $this->filters['date_fin']]);
        }
        if (!empty($this->filters['search'])) {
            $query->where('description', 'like', "%{$this->filters['search']}%");
        }
        return $query->orderByDesc('date_depense')->get();
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
