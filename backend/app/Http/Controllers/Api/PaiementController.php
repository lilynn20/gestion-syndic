<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Bien;
use App\Models\Recu;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Frais;
use Carbon\Carbon;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::with(['bien.proprietaire', 'frais', 'recu']);

        if ($request->has('bien_id')) {
            $query->where('bien_id', $request->bien_id);
        }

        if ($request->has('annee')) {
            $query->where('annee', $request->annee);
        }

        if ($request->has('mois')) {
            $query->where('mois', $request->mois);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $paiements = $query->orderBy('date_paiement', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $paiements
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bien_id' => 'required|exists:biens,id',
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2000|max:2100',
            'montant' => 'required|numeric|min:0',
            'date_paiement' => 'required|date',
            'notes' => 'nullable|string',
            'include_extra_fees' => 'nullable|boolean',
        ]);

        // Vérifier si un paiement existe déjà pour ce mois/année
        $existingPaiement = Paiement::where('bien_id', $validated['bien_id'])
            ->where('mois', $validated['mois'])
            ->where('annee', $validated['annee'])
            ->first();

        if ($existingPaiement) {
            return response()->json([
                'success' => false,
                'message' => 'Un paiement existe déjà pour ce bien pour ce mois'
            ], 422);
        }

        // Calculer la date d'échéance (31 du mois)
        $dateEcheance = Carbon::create($validated['annee'], $validated['mois'], 1)->endOfMonth();
        $datePaiement = Carbon::parse($validated['date_paiement']);

        // Déterminer le statut
        if ($datePaiement->lt($dateEcheance->copy()->subMonth())) {
            $statut = 'avance';
        } elseif ($datePaiement->gt($dateEcheance)) {
            $statut = 'en_retard';
        } else {
            $statut = 'paye';
        }

        $validated['date_echeance'] = $dateEcheance;
        $validated['statut'] = $statut;

        // Calculate extra fees amount if included
        $extraFeesAmount = 0;
        $extraFeesPaid = [];
        
        if ($request->boolean('include_extra_fees')) {
            $bienId = $validated['bien_id'];
            $totalBiens = Bien::count();
            if ($totalBiens > 0) {
                // Get all unpaid frais for this bien: global, bien_ids, bien_id
                $fraisList = Frais::where(function($q) use ($bienId) {
                        $q->where('is_global', true)
                          ->orWhereJsonContains('bien_ids', (int)$bienId)
                          ->orWhere('bien_id', $bienId);
                    })
                    ->where('paye', false)
                    ->get()
                    ->filter(function ($frais) use ($bienId) {
                        return !$frais->hasBienPaid((int)$bienId);
                    });

                foreach ($fraisList as $frais) {
                    // For global, split by all biens; for others, use full amount
                    if ($frais->is_global) {
                        $shareAmount = round($frais->montant / $totalBiens, 2);
                    } else {
                        $shareAmount = $frais->montant;
                    }
                    $extraFeesAmount += $shareAmount;
                    $extraFeesPaid[] = [
                        'frais_id' => $frais->id,
                        'share_amount' => $shareAmount,
                        'description' => $frais->description,
                    ];
                }
            }
        }

        $paiement = Paiement::create($validated);

        // Mark global frais as paid by this bien
        foreach ($extraFeesPaid as $fee) {
            $frais = Frais::find($fee['frais_id']);
            if ($frais) {
                $frais->markBienAsPaid((int)$validated['bien_id']);
            }
        }

        // Générer automatiquement un reçu with total including extra fees
        $montantTotal = $paiement->montant + $extraFeesAmount;
        
        Recu::create([
            'paiement_id' => $paiement->id,
            'numero_recu' => Recu::generateNumero(),
            'date_emission' => now(),
            'montant_total' => $montantTotal,
        ]);

        // Add extra fees info to response
        $paiementData = $paiement->load(['bien.proprietaire', 'frais', 'recu']);
        $paiementData->extra_fees_paid = $extraFeesPaid;
        $paiementData->extra_fees_amount = $extraFeesAmount;

        return response()->json([
            'success' => true,
            'message' => 'Paiement enregistré avec succès',
            'data' => $paiementData
        ], 201);
    }

    public function storeMultiple(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bien_id' => 'required|exists:biens,id',
            'mois_debut' => 'required|integer|min:1|max:12',
            'annee_debut' => 'required|integer|min:2000|max:2100',
            'nombre_mois' => 'required|integer|min:1|max:24',
            'montant_par_mois' => 'required|numeric|min:0',
            'date_paiement' => 'required|date',
            'include_extra_fees' => 'nullable|boolean',
        ]);

        $paiements = [];
        $mois = $validated['mois_debut'];
        $annee = $validated['annee_debut'];
        $datePaiement = Carbon::parse($validated['date_paiement']);
        
        // Handle extra fees for the first payment only
        $extraFeesAmount = 0;
        $extraFeesPaid = [];
        
        if ($request->boolean('include_extra_fees')) {
            $bienId = $validated['bien_id'];
            $totalBiens = Bien::count();
            
            if ($totalBiens > 0) {
                $globalFrais = Frais::where('is_global', true)
                    ->where('paye', false)
                    ->get()
                    ->filter(function ($frais) use ($bienId) {
                        return !$frais->hasBienPaid((int)$bienId);
                    });

                foreach ($globalFrais as $frais) {
                    $shareAmount = round($frais->montant / $totalBiens, 2);
                    $extraFeesAmount += $shareAmount;
                    $extraFeesPaid[] = [
                        'frais_id' => $frais->id,
                        'share_amount' => $shareAmount,
                        'description' => $frais->description,
                    ];
                }
            }
        }

        $isFirstPayment = true;

        for ($i = 0; $i < $validated['nombre_mois']; $i++) {
            // Vérifier si un paiement existe déjà
            $existingPaiement = Paiement::where('bien_id', $validated['bien_id'])
                ->where('mois', $mois)
                ->where('annee', $annee)
                ->first();

            if (!$existingPaiement) {
                $dateEcheance = Carbon::create($annee, $mois, 1)->endOfMonth();

                $paiement = Paiement::create([
                    'bien_id' => $validated['bien_id'],
                    'mois' => $mois,
                    'annee' => $annee,
                    'montant' => $validated['montant_par_mois'],
                    'date_paiement' => $datePaiement,
                    'date_echeance' => $dateEcheance,
                    'statut' => 'avance',
                ]);

                // Add extra fees to the first payment's receipt
                $montantTotal = $paiement->montant;
                if ($isFirstPayment && $extraFeesAmount > 0) {
                    $montantTotal += $extraFeesAmount;
                    
                    // Mark global frais as paid
                    foreach ($extraFeesPaid as $fee) {
                        $frais = Frais::find($fee['frais_id']);
                        if ($frais) {
                            $frais->markBienAsPaid((int)$validated['bien_id']);
                        }
                    }
                    $isFirstPayment = false;
                }

                Recu::create([
                    'paiement_id' => $paiement->id,
                    'numero_recu' => Recu::generateNumero(),
                    'date_emission' => now(),
                    'montant_total' => $montantTotal,
                ]);

                $paiements[] = $paiement;
            }

            // Passer au mois suivant
            $mois++;
            if ($mois > 12) {
                $mois = 1;
                $annee++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($paiements) . ' paiement(s) enregistré(s) avec succès',
            'data' => Paiement::whereIn('id', collect($paiements)->pluck('id'))
                ->with(['bien.proprietaire', 'frais', 'recu'])
                ->get()
        ], 201);
    }

    public function show(Paiement $paiement): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $paiement->load(['bien.proprietaire', 'frais', 'recu'])
        ]);
    }

    public function update(Request $request, Paiement $paiement): JsonResponse
    {
        $validated = $request->validate([
            'montant' => 'sometimes|required|numeric|min:0',
            'date_paiement' => 'sometimes|required|date',
            'notes' => 'nullable|string',
        ]);

        $paiement->update($validated);

        // Mettre à jour le reçu si le montant a changé
        if (isset($validated['montant']) && $paiement->recu) {
            $paiement->recu->update([
                'montant_total' => $paiement->montant_total
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Paiement mis à jour avec succès',
            'data' => $paiement->load(['bien.proprietaire', 'frais', 'recu'])
        ]);
    }

    public function destroy(Paiement $paiement): JsonResponse
    {
        $paiement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paiement supprimé avec succès'
        ]);
    }

    public function statistiques(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        $totalPaiements = Paiement::where('annee', $annee)->sum('montant');
        $nombrePaiements = Paiement::where('annee', $annee)->count();
        $paiementsEnRetard = Paiement::where('annee', $annee)
            ->where('statut', 'en_retard')
            ->count();
        $paiementsAvance = Paiement::where('annee', $annee)
            ->where('statut', 'avance')
            ->count();

        // Paiements par mois
        $paiementsParMois = Paiement::where('annee', $annee)
            ->selectRaw('mois, SUM(montant) as total, COUNT(*) as nombre')
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_paiements' => $totalPaiements,
                'nombre_paiements' => $nombrePaiements,
                'paiements_en_retard' => $paiementsEnRetard,
                'paiements_avance' => $paiementsAvance,
                'paiements_par_mois' => $paiementsParMois,
            ]
        ]);
    }
    /**
     * Export all paiements to Excel
     */
    public function exportExcel(Request $request)
    {
        $filters = $request->only(['bien_id', 'annee', 'mois', 'statut']);
        $fileName = 'paiements_' . now()->format('Ymd_His') . '.xlsx';
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PaiementsExport($filters), $fileName);
    }
}
