<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Frais;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FraisController extends Controller
{
    public function getUnpaidFraisForBien(Request $request): JsonResponse
    {
        try {
            $bienId = $request->query('bien_id');
            if (!$bienId) {
                return response()->json(['success' => false, 'message' => 'bien_id est requis'], 422);
            }
            $totalBiens = \App\Models\Bien::count();
            $fraisList = \App\Models\Frais::where(function($q) use ($bienId) {
                    $q->where('is_global', true)
                      ->orWhereJsonContains('bien_ids', (int)$bienId)
                      ->orWhere('bien_id', $bienId);
                })
                ->where('paye', false)
                ->get()
                ->filter(fn($frais) => !$frais->hasBienPaid((int)$bienId))
                ->map(function($frais) use ($totalBiens) {
                    $arr = $frais->toArray();
                    if ($frais->is_global) {
                        $arr['share_amount'] = $totalBiens > 0 ? round($frais->montant / $totalBiens, 2) : 0;
                    } elseif (!empty($frais->bien_ids)) {
                        $arr['share_amount'] = count($frais->bien_ids) > 0 ? round($frais->montant / count($frais->bien_ids), 2) : 0;
                    } else {
                        $arr['share_amount'] = $frais->montant;
                    }
                    return $arr;
                })->values();

            return response()->json([
                'success' => true,
                'data' => $fraisList,
                'total_share' => round($fraisList->sum('share_amount'), 2),
                'total_biens' => $totalBiens
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    public function index(Request $request): JsonResponse
    {
        $query = Frais::with(['bien.proprietaire', 'paiement']);

        if ($request->has('bien_id')) {
            $bienId = $request->bien_id;
            $query->where(function($q) use ($bienId) {
                $q->where('bien_id', $bienId)
                  ->orWhere('is_global', true)
                  ->orWhereJsonContains('bien_ids', (int)$bienId);
            });
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
            'scope' => 'required|string|in:single,global,appartments,garages,custom',
            'bien_ids' => 'nullable|array',
            'bien_ids.*' => 'exists:biens,id'
        ]);
        switch ($validated['scope']) {
            case 'global':
                $validated['is_global'] = true;
                $validated['bien_id'] = null;
                $validated['bien_ids'] = null;
                $validated['paid_by_biens'] = [];
                break;
            case 'appartments':
                $validated['is_global'] = false;
                $validated['bien_id'] = null;
                $validated['bien_ids'] = \App\Models\Bien::where('type', 'appartement')->pluck('id')->values()->all();
                break;
            case 'garages':
                $validated['is_global'] = false;
                $validated['bien_id'] = null;
                // Use biens of type 'magasin' for garages
                $validated['bien_ids'] = \App\Models\Bien::where('type', 'magasin')->pluck('id')->values()->all();
                break;
            case 'custom':
                $validated['is_global'] = false;
                $validated['bien_id'] = null;
                // Ensure bien_ids is always an array
                $validated['bien_ids'] = isset($validated['bien_ids']) ? array_values($validated['bien_ids']) : [];
                break;
            case 'single':
            default:
                $validated['is_global'] = false;
                $validated['bien_ids'] = null;
                // bien_id must be set
                break;
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
            'bien_id' => 'nullable|exists:biens,id',
            'paiement_id' => 'nullable|exists:paiements,id',
            'description' => 'sometimes|required|string|max:255',
            'montant' => 'sometimes|required|numeric|min:0',
            'date_frais' => 'sometimes|required|date',
            'paye' => 'nullable|boolean',
            'scope' => 'sometimes|required|string|in:single,global,appartments,garages,custom',
            'bien_ids' => 'nullable|array',
            'bien_ids.*' => 'exists:biens,id'
        ]);

        // Ensure bien_ids is set correctly for each scope
        if (isset($validated['scope'])) {
            switch ($validated['scope']) {
                case 'global':
                    $validated['is_global'] = true;
                    $validated['bien_id'] = null;
                    $validated['bien_ids'] = null;
                    $validated['paid_by_biens'] = [];
                    break;
                case 'appartments':
                    $validated['is_global'] = false;
                    $validated['bien_id'] = null;
                    $validated['bien_ids'] = \App\Models\Bien::where('type', 'appartement')->pluck('id')->values()->all();
                    break;
                case 'garages':
                    $validated['is_global'] = false;
                    $validated['bien_id'] = null;
                    // Use biens of type 'magasin' for garages
                    $validated['bien_ids'] = \App\Models\Bien::where('type', 'magasin')->pluck('id')->values()->all();
                    break;
                case 'custom':
                    $validated['is_global'] = false;
                    $validated['bien_id'] = null;
                    $validated['bien_ids'] = isset($validated['bien_ids']) ? array_values($validated['bien_ids']) : [];
                    break;
                case 'single':
                default:
                    $validated['is_global'] = false;
                    $validated['bien_ids'] = null;
                    // bien_id must be set
                    break;
            }
        }

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
        // Debug: log route parameters and request data
        \Log::info('DEBUG: Route parameters', request()->route()?->parameters() ?? []);
        \Log::info('DEBUG: Request all()', request()->all());
        \Log::info('Suppression frais demandée', [
            'id' => $frais->id,
            'is_global' => $frais->is_global,
            'scope' => $frais->scope,
            'bien_id' => $frais->bien_id,
        ]);
        $deleted = $frais->delete();
        // Check if the frais still exists in the database
        $stillExists = \App\Models\Frais::find($frais->id) !== null;
        \Log::info('Résultat suppression frais', [
            'id' => $frais->id,
            'deleted' => $deleted,
            'still_exists' => $stillExists,
        ]);

        return response()->json([
            'success' => $deleted && !$stillExists,
            'message' => !$stillExists ? 'Frais supprimé avec succès' : 'Échec de la suppression du frais (toujours présent en base)',
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
