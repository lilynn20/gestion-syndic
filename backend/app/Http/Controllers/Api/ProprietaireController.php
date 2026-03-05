<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proprietaire;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProprietaireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Proprietaire::with('biens');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $proprietaires = $query->orderBy('nom')->get();

        return response()->json([
            'success' => true,
            'data' => $proprietaires
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'nullable|email|unique:proprietaires,email',
            'telephone' => 'nullable|string|max:20',
        ]);

        $proprietaire = Proprietaire::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Propriétaire créé avec succès',
            'data' => $proprietaire->load('biens')
        ], 201);
    }

    public function show(Proprietaire $proprietaire): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $proprietaire->load(['biens.paiements', 'biens.frais'])
        ]);
    }

    public function update(Request $request, Proprietaire $proprietaire): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'prenom' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:proprietaires,email,' . $proprietaire->id,
            'telephone' => 'nullable|string|max:20',
        ]);

        $proprietaire->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Propriétaire mis à jour avec succès',
            'data' => $proprietaire->load('biens')
        ]);
    }

    public function destroy(Proprietaire $proprietaire): JsonResponse
    {
        $proprietaire->delete();

        return response()->json([
            'success' => true,
            'message' => 'Propriétaire supprimé avec succès'
        ]);
    }

    public function paiements(Proprietaire $proprietaire): JsonResponse
    {
        $paiements = $proprietaire->biens()
            ->with('paiements.frais', 'paiements.recu')
            ->get()
            ->pluck('paiements')
            ->flatten();

        return response()->json([
            'success' => true,
            'data' => $paiements
        ]);
    }
}
