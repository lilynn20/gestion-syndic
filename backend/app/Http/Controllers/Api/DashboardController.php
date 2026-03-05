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
        $anneeDebut = $request->get('annee_debut', $request->get('annee', date('Y')));
        $anneeFin = $request->get('annee_fin', $anneeDebut);
        $typeFilter = $request->get('type');
        $proprietaireFilter = $request->get('proprietaire_id');

        // S'assurer que annee_debut <= annee_fin
        if ($anneeDebut > $anneeFin) {
            $temp = $anneeDebut;
            $anneeDebut = $anneeFin;
            $anneeFin = $temp;
        }

        $query = Bien::with(['proprietaire', 'paiements' => function ($q) use ($anneeDebut, $anneeFin) {
            $q->whereBetween('annee', [$anneeDebut, $anneeFin]);
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
                'date_adhesion' => $bien->date_adhesion,
                'mois' => [],
                'total_paye' => 0,
            ];

            // Parcourir toutes les années dans la plage
            for ($annee = $anneeDebut; $annee <= $anneeFin; $annee++) {
                // Déterminer le mois de début basé sur date_adhesion
                $moisDebut = 1;
                if ($bien->date_adhesion) {
                    $dateAdhesion = Carbon::parse($bien->date_adhesion);
                    if ($dateAdhesion->year == $annee) {
                        $moisDebut = $dateAdhesion->month;
                    } elseif ($dateAdhesion->year > $annee) {
                        $moisDebut = 13; // Pas encore adhérent cette année
                    }
                }

                for ($mois = 1; $mois <= 12; $mois++) {
                    $key = $annee . '-' . str_pad($mois, 2, '0', STR_PAD_LEFT);
                    
                    // Si le mois est avant l'adhésion, marquer comme non applicable
                    if ($mois < $moisDebut) {
                        $ligne['mois'][$key] = [
                            'annee' => $annee,
                            'mois' => $mois,
                            'paye' => false,
                            'montant' => 0,
                            'statut' => 'non_applicable',
                            'paiement_id' => null,
                            'date_paiement' => null,
                        ];
                        continue;
                    }

                    $paiement = $bien->paiements->first(function ($p) use ($mois, $annee) {
                        return $p->mois === $mois && $p->annee === (int)$annee;
                    });

                    $dateEcheance = Carbon::create($annee, $mois, 1)->endOfMonth();
                    $estEnRetard = !$paiement && $dateEcheance->isPast();

                    $ligne['mois'][$key] = [
                        'annee' => $annee,
                        'mois' => $mois,
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
            }

            $tableau[] = $ligne;
        }

        // Générer la liste des colonnes (mois) pour le frontend
        $colonnes = [];
        for ($annee = $anneeDebut; $annee <= $anneeFin; $annee++) {
            for ($mois = 1; $mois <= 12; $mois++) {
                $key = $annee . '-' . str_pad($mois, 2, '0', STR_PAD_LEFT);
                $colonnes[] = [
                    'key' => $key,
                    'annee' => $annee,
                    'mois' => $mois,
                    'label' => $this->getNomMois($mois) . ' ' . substr($annee, 2),
                ];
            }
        }

        // Calcul des totaux par mois
        $totauxParMois = [];
        foreach ($colonnes as $col) {
            $total = 0;
            foreach ($tableau as $ligne) {
                if (isset($ligne['mois'][$col['key']])) {
                    $total += $ligne['mois'][$col['key']]['montant'];
                }
            }
            $totauxParMois[$col['key']] = $total;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tableau' => $tableau,
                'colonnes' => $colonnes,
                'totaux_par_mois' => $totauxParMois,
                'total_general' => array_sum($totauxParMois),
                'annee_debut' => (int)$anneeDebut,
                'annee_fin' => (int)$anneeFin,
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
            // Déterminer le mois de début basé sur date_adhesion
            $moisDebut = 1;
            if ($bien->date_adhesion) {
                $dateAdhesion = Carbon::parse($bien->date_adhesion);
                if ($dateAdhesion->year == $annee) {
                    $moisDebut = $dateAdhesion->month;
                } elseif ($dateAdhesion->year > $annee) {
                    continue; // Pas encore adhérent cette année
                }
            }

            for ($mois = $moisDebut; $mois <= 12; $mois++) {
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
