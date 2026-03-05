<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use App\Models\Paiement;
use App\Models\Depense;
use App\Models\Proprietaire;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        // Statistiques générales
        $totalProprietaires = Proprietaire::count();
        $totalBiens = Bien::count();
        $totalAppartements = Bien::where('type', 'appartement')->count();
        $totalMagasins = Bien::where('type', 'magasin')->count();

        // Statistiques des paiements
        $totalPaiements = Paiement::where('annee', $annee)->sum('montant');
        $paiementsEnRetard = $this->getPaiementsEnRetard($annee);

        // Statistiques des dépenses
        $totalDepenses = Depense::whereYear('date_depense', $annee)->sum('montant');

        // Solde
        $solde = $totalPaiements - $totalDepenses;

        return response()->json([
            'success' => true,
            'data' => [
                'statistiques' => [
                    'total_proprietaires' => $totalProprietaires,
                    'total_biens' => $totalBiens,
                    'total_appartements' => $totalAppartements,
                    'total_magasins' => $totalMagasins,
                    'total_paiements' => $totalPaiements,
                    'paiements_en_retard' => $paiementsEnRetard,
                    'total_depenses' => $totalDepenses,
                    'solde' => $solde,
                ],
                'annee' => $annee,
            ]
        ]);
    }

    public function tableauPaiements(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $typeFilter = $request->get('type');
        $proprietaireFilter = $request->get('proprietaire_id');

        $query = Bien::with(['proprietaire', 'paiements' => function ($q) use ($annee) {
            $q->where('annee', $annee);
        }]);

        if ($typeFilter) {
            $query->where('type', $typeFilter);
        }

        if ($proprietaireFilter) {
            $query->where('proprietaire_id', $proprietaireFilter);
        }

        $biens = $query->orderBy('numero')->get();

        $tableau = [];
        foreach ($biens as $bien) {
            $ligne = [
                'bien_id' => $bien->id,
                'numero' => $bien->numero,
                'type' => $bien->type,
                'proprietaire' => $bien->proprietaire->full_name,
                'proprietaire_id' => $bien->proprietaire_id,
                'mois' => [],
                'total_paye' => 0,
            ];

            for ($mois = 1; $mois <= 12; $mois++) {
                $paiement = $bien->paiements->first(function ($p) use ($mois) {
                    return $p->mois === $mois;
                });

                $dateEcheance = Carbon::create($annee, $mois, 1)->endOfMonth();
                $estEnRetard = !$paiement && $dateEcheance->isPast();

                $ligne['mois'][$mois] = [
                    'paye' => $paiement !== null,
                    'montant' => $paiement ? $paiement->montant : 0,
                    'statut' => $paiement ? $paiement->statut : ($estEnRetard ? 'en_retard' : 'non_paye'),
                    'paiement_id' => $paiement ? $paiement->id : null,
                    'date_paiement' => $paiement ? $paiement->date_paiement->format('d/m/Y') : null,
                ];

                if ($paiement) {
                    $ligne['total_paye'] += $paiement->montant;
                }
            }

            $tableau[] = $ligne;
        }

        // Calcul des totaux par mois
        $totauxParMois = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $total = 0;
            foreach ($tableau as $ligne) {
                $total += $ligne['mois'][$mois]['montant'];
            }
            $totauxParMois[$mois] = $total;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tableau' => $tableau,
                'totaux_par_mois' => $totauxParMois,
                'total_general' => array_sum($totauxParMois),
                'annee' => $annee,
            ]
        ]);
    }

    public function evolutionPaiements(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        $evolution = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $paiements = Paiement::where('annee', $annee)
                ->where('mois', $mois)
                ->sum('montant');

            $depenses = Depense::whereYear('date_depense', $annee)
                ->whereMonth('date_depense', $mois)
                ->sum('montant');

            $evolution[] = [
                'mois' => $mois,
                'nom_mois' => $this->getNomMois($mois),
                'paiements' => $paiements,
                'depenses' => $depenses,
                'solde' => $paiements - $depenses,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $evolution
        ]);
    }

    private function getPaiementsEnRetard(int $annee): int
    {
        $biens = Bien::all();
        $count = 0;
        $maintenant = Carbon::now();

        foreach ($biens as $bien) {
            for ($mois = 1; $mois <= 12; $mois++) {
                $dateEcheance = Carbon::create($annee, $mois, 1)->endOfMonth();
                
                if ($dateEcheance->isPast()) {
                    $paiement = Paiement::where('bien_id', $bien->id)
                        ->where('mois', $mois)
                        ->where('annee', $annee)
                        ->first();

                    if (!$paiement) {
                        $count++;
                    }
                }
            }
        }

        return $count;
    }

    private function getNomMois(int $mois): string
    {
        $noms = [
            1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juil', 8 => 'Août',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc'
        ];
        return $noms[$mois] ?? '';
    }
}
