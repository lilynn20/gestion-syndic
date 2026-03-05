<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BienController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Bien::with('proprietaire');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('proprietaire_id')) {
            $query->where('proprietaire_id', $request->proprietaire_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('adresse', 'like', "%{$search}%");
            });
        }

        $biens = $query->orderBy('numero')->get();

        return response()->json([
            'success' => true,
            'data' => $biens
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'proprietaire_id' => 'required|exists:proprietaires,id',
            'type' => 'required|in:appartement,magasin',
            'numero' => 'required|string|max:50',
            'adresse' => 'nullable|string|max:255',
            'cotisation_mensuelle' => 'nullable|numeric|min:0',
            'date_adhesion' => 'nullable|date',
        ]);

        if (!isset($validated['cotisation_mensuelle'])) {
            $validated['cotisation_mensuelle'] = 50.00;
        }

        $bien = Bien::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bien créé avec succès',
            'data' => $bien->load('proprietaire')
        ], 201);
    }

    public function show(Bien $bien): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $bien->load(['proprietaire', 'paiements.frais', 'paiements.recu'])
        ]);
    }

    public function update(Request $request, Bien $bien): JsonResponse
    {
        $validated = $request->validate([
            'proprietaire_id' => 'sometimes|required|exists:proprietaires,id',
            'type' => 'sometimes|required|in:appartement,magasin',
            'numero' => 'sometimes|required|string|max:50',
            'adresse' => 'nullable|string|max:255',
            'cotisation_mensuelle' => 'nullable|numeric|min:0',
            'date_adhesion' => 'nullable|date',
        ]);

        $bien->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bien mis à jour avec succès',
            'data' => $bien->load('proprietaire')
        ]);
    }

    public function destroy(Bien $bien): JsonResponse
    {
        $bien->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bien supprimé avec succès'
        ]);
    }

    public function paiements(Bien $bien, Request $request): JsonResponse
    {
        $query = $bien->paiements()->with('frais', 'recu');

        if ($request->has('annee')) {
            $query->where('annee', $request->annee);
        }

        if ($request->has('mois')) {
            $query->where('mois', $request->mois);
        }

        $paiements = $query->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $paiements
        ]);
    }

    public function statutPaiements(Bien $bien, Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $statuts = [];

        for ($mois = 1; $mois <= 12; $mois++) {
            $statuts[$mois] = [
                'mois' => $mois,
                'statut' => $bien->getStatutPaiement($mois, $annee),
                'paiement' => $bien->getPaiementPourMois($mois, $annee)
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $statuts
        ]);
    }
}
