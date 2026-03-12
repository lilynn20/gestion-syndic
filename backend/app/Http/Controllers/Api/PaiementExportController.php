<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Exports\PaiementsExport;
use Maatwebsite\Excel\Facades\Excel;

class PaiementController extends Controller
{
    // ...existing code...

    /**
     * Export all paiements to Excel
     */
    public function exportExcel(Request $request)
    {
        $fileName = 'paiements_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new PaiementsExport, $fileName);
    }

    // ...existing code...
}
