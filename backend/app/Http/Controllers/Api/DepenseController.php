<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Depense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DepenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Depense::query();

        if ($request->has('categorie')) {
            $query->where('categorie', $request->categorie);
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date_depense', [$request->date_debut, $request->date_fin]);
        }

        if ($request->has('search')) {
            $query->where('description', 'like', "%{$request->search}%");
        }

        $depenses = $query->orderBy('date_depense', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $depenses,
            'total' => $depenses->sum('montant')
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'montant' => 'required|numeric|min:0',
            'date_depense' => 'required|date',
            'categorie' => 'nullable|string|max:100',
        ]);

        $depense = Depense::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dépense créée avec succès',
            'data' => $depense
        ], 201);
    }

    public function show(Depense $depense): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $depense
        ]);
    }

    public function update(Request $request, Depense $depense): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'sometimes|required|string|max:255',
            'montant' => 'sometimes|required|numeric|min:0',
            'date_depense' => 'sometimes|required|date',
            'categorie' => 'nullable|string|max:100',
        ]);

        $depense->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dépense mise à jour avec succès',
            'data' => $depense
        ]);
    }

    public function destroy(Depense $depense): JsonResponse
    {
        $depense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dépense supprimée avec succès'
        ]);
    }

    public function statistiques(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        $totalDepenses = Depense::whereYear('date_depense', $annee)->sum('montant');
        $nombreDepenses = Depense::whereYear('date_depense', $annee)->count();

        // Dépenses par catégorie
        $depensesParCategorie = Depense::whereYear('date_depense', $annee)
            ->selectRaw('categorie, SUM(montant) as total, COUNT(*) as nombre')
            ->groupBy('categorie')
            ->get();

        // Dépenses par mois
        $depensesParMois = Depense::whereYear('date_depense', $annee)
            ->selectRaw('MONTH(date_depense) as mois, SUM(montant) as total, COUNT(*) as nombre')
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_depenses' => $totalDepenses,
                'nombre_depenses' => $nombreDepenses,
                'depenses_par_categorie' => $depensesParCategorie,
                'depenses_par_mois' => $depensesParMois,
            ]
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Depense::distinct()
            ->whereNotNull('categorie')
            ->pluck('categorie');

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }
}
