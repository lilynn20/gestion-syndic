<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Frais;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FraisController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Frais::with(['bien.proprietaire', 'paiement']);

        if ($request->has('bien_id')) {
            $query->where('bien_id', $request->bien_id);
        }

        if ($request->has('paye')) {
            $query->where('paye', $request->paye === 'true' || $request->paye === '1');
        }

        $frais = $query->orderBy('date_frais', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $frais
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bien_id' => 'nullable|exists:biens,id',
            'paiement_id' => 'nullable|exists:paiements,id',
            'description' => 'required|string|max:255',
            'montant' => 'required|numeric|min:0',
            'date_frais' => 'required|date',
            'paye' => 'nullable|boolean',
            'is_global' => 'nullable|boolean',
        ]);

        // If global, remove bien_id requirement
        if ($request->boolean('is_global')) {
            $validated['is_global'] = true;
            $validated['bien_id'] = null;
            $validated['paid_by_biens'] = [];
        }

        $frais = Frais::create($validated);

        // Mettre à jour le reçu du paiement associé si existant
        if ($frais->paiement && $frais->paiement->recu) {
            $frais->paiement->recu->update([
                'montant_total' => $frais->paiement->montant_total
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Frais créé avec succès',
            'data' => $frais->load(['bien.proprietaire', 'paiement'])
        ], 201);
    }

    public function show(Frais $frais): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $frais->load(['bien.proprietaire', 'paiement'])
        ]);
    }

    public function update(Request $request, Frais $frais): JsonResponse
    {
        $validated = $request->validate([
            'bien_id' => 'sometimes|required|exists:biens,id',
            'paiement_id' => 'nullable|exists:paiements,id',
            'description' => 'sometimes|required|string|max:255',
            'montant' => 'sometimes|required|numeric|min:0',
            'date_frais' => 'sometimes|required|date',
            'paye' => 'nullable|boolean',
        ]);

        $frais->update($validated);

        // Mettre à jour le reçu du paiement associé si existant
        if ($frais->paiement && $frais->paiement->recu) {
            $frais->paiement->recu->update([
                'montant_total' => $frais->paiement->montant_total
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Frais mis à jour avec succès',
            'data' => $frais->load(['bien.proprietaire', 'paiement'])
        ]);
    }

    public function destroy(Frais $frais): JsonResponse
    {
        $frais->delete();

        return response()->json([
            'success' => true,
            'message' => 'Frais supprimé avec succès'
        ]);
    }

    /**
     * Get unpaid global frais for a specific bien
     */
    public function getUnpaidGlobalFrais(Request $request): JsonResponse
    {
        $bienId = $request->query('bien_id');
        
        if (!$bienId) {
            return response()->json([
                'success' => false,
                'message' => 'bien_id est requis'
            ], 422);
        }

        // Get total number of biens for calculating share
        $totalBiens = \App\Models\Bien::count();
        
        if ($totalBiens === 0) {
            return response()->json([
                'success' => true,
                'data' => [],
                'total_share' => 0
            ]);
        }

        // Get global frais that this bien hasn't paid yet
        $globalFrais = Frais::where('is_global', true)
            ->where('paye', false)
            ->get()
            ->filter(function ($frais) use ($bienId) {
                return !$frais->hasBienPaid((int)$bienId);
            })
            ->map(function ($frais) use ($totalBiens) {
                $frais->share_amount = round($frais->montant / $totalBiens, 2);
                return $frais;
            })
            ->values();

        $totalShare = $globalFrais->sum('share_amount');

        return response()->json([
            'success' => true,
            'data' => $globalFrais,
            'total_share' => round($totalShare, 2),
            'total_biens' => $totalBiens
        ]);
    }
}
