<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recu;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Barryvdh\DomPDF\Facade\Pdf;

class RecuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Recu::with(['paiement.bien.proprietaire', 'paiement.frais']);

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date_emission', [$request->date_debut, $request->date_fin]);
        }

        $recus = $query->orderBy('date_emission', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $recus
        ]);
    }

    public function show(Recu $recu): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $recu->load(['paiement.bien.proprietaire', 'paiement.frais'])
        ]);
    }

    public function downloadPdf(Recu $recu)
    {
        $recu->load(['paiement.bien.proprietaire', 'paiement.frais']);

        $pdf = Pdf::loadView('recus.pdf', [
            'recu' => $recu,
            'paiement' => $recu->paiement,
            'bien' => $recu->paiement->bien,
            'proprietaire' => $recu->paiement->bien->proprietaire,
        ]);

        return $pdf->download('recu-' . $recu->numero_recu . '.pdf');
    }

    public function regenerate(Paiement $paiement): JsonResponse
    {
        // Supprimer l'ancien reçu s'il existe
        if ($paiement->recu) {
            $paiement->recu->delete();
        }

        // Créer un nouveau reçu
        $recu = Recu::create([
            'paiement_id' => $paiement->id,
            'numero_recu' => Recu::generateNumero(),
            'date_emission' => now(),
            'montant_total' => $paiement->montant_total,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reçu régénéré avec succès',
            'data' => $recu->load(['paiement.bien.proprietaire'])
        ]);
    }
}
