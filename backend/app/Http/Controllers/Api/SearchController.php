<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proprietaire;
use App\Models\Bien;
use App\Models\Paiement;
use App\Models\Depense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    /**
     * Global search across all entities
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data' => [
                    'proprietaires' => [],
                    'biens' => [],
                    'paiements' => [],
                    'depenses' => [],
                ]
            ]);
        }

        // Search proprietaires
        $proprietaires = Proprietaire::where('nom', 'like', "%{$query}%")
            ->orWhere('prenom', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('telephone', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'nom', 'prenom', 'email']);

        // Search biens
        $biens = Bien::with('proprietaire:id,nom,prenom')
            ->where('numero', 'like', "%{$query}%")
            ->orWhere('adresse', 'like', "%{$query}%")
            ->orWhereHas('proprietaire', function($q) use ($query) {
                $q->where('nom', 'like', "%{$query}%")
                  ->orWhere('prenom', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'numero', 'type', 'proprietaire_id']);

        // Search depenses by description or category
        $depenses = Depense::where('description', 'like', "%{$query}%")
            ->orWhere('categorie', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'description', 'categorie', 'montant', 'date_depense']);

        return response()->json([
            'success' => true,
            'data' => [
                'proprietaires' => $proprietaires,
                'biens' => $biens,
                'depenses' => $depenses,
            ]
        ]);
    }
}
