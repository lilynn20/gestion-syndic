<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Depense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Exports\DepensesExport;
use Maatwebsite\Excel\Facades\Excel;

class DepenseExportController extends Controller
{
    /**
     * Export all depenses to Excel
     */
    public function exportExcel(Request $request)
    {
        $fileName = 'depenses_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new DepensesExport, $fileName);
    }
}
