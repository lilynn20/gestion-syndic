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
            'bien_id' => 'required|exists:biens,id',
            'paiement_id' => 'nullable|exists:paiements,id',
            'description' => 'required|string|max:255',
            'montant' => 'required|numeric|min:0',
            'date_frais' => 'required|date',
            'paye' => 'nullable|boolean',
        ]);

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
}
