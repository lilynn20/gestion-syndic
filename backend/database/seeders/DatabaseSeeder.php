<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Proprietaire;
use App\Models\Bien;
use App\Models\Paiement;
use App\Models\Frais;
use App\Models\Depense;
use App\Models\Recu;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Créer un utilisateur admin
        User::create([
            'name' => 'Admin Syndic',
            'email' => 'admin@syndic.ma',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Créer un utilisateur syndic
        User::create([
            'name' => 'Gestionnaire',
            'email' => 'syndic@syndic.ma',
            'password' => Hash::make('password'),
            'role' => 'syndic',
        ]);

        // Créer des propriétaires
        $proprietaires = [
            ['nom' => 'Benali', 'prenom' => 'Mohammed', 'email' => 'mohammed.benali@email.com', 'telephone' => '0661234567'],
            ['nom' => 'El Amrani', 'prenom' => 'Fatima', 'email' => 'fatima.elamrani@email.com', 'telephone' => '0662345678'],
            ['nom' => 'Hassani', 'prenom' => 'Ahmed', 'email' => 'ahmed.hassani@email.com', 'telephone' => '0663456789'],
            ['nom' => 'Ouazzani', 'prenom' => 'Khadija', 'email' => 'khadija.ouazzani@email.com', 'telephone' => '0664567890'],
            ['nom' => 'Tazi', 'prenom' => 'Youssef', 'email' => 'youssef.tazi@email.com', 'telephone' => '0665678901'],
            ['nom' => 'Alaoui', 'prenom' => 'Sara', 'email' => 'sara.alaoui@email.com', 'telephone' => '0666789012'],
        ];

        foreach ($proprietaires as $propData) {
            $proprietaire = Proprietaire::create($propData);

            // Créer 1 ou 2 biens par propriétaire
            $nombreBiens = rand(1, 2);
            for ($i = 0; $i < $nombreBiens; $i++) {
                $type = rand(0, 1) ? 'appartement' : 'magasin';
                $bien = Bien::create([
                    'proprietaire_id' => $proprietaire->id,
                    'type' => $type,
                    'numero' => ($type === 'appartement' ? 'A' : 'M') . rand(1, 20),
                    'adresse' => 'Immeuble Résidence El Fath, Casablanca',
                    'cotisation_mensuelle' => 50.00,
                ]);

                // Créer des paiements pour l'année en cours
                $anneeActuelle = date('Y');
                $moisActuel = date('n');

                for ($mois = 1; $mois <= $moisActuel; $mois++) {
                    // 80% de chance d'avoir payé
                    if (rand(1, 100) <= 80) {
                        $dateEcheance = Carbon::create($anneeActuelle, $mois, 1)->endOfMonth();
                        $datePaiement = Carbon::create($anneeActuelle, $mois, rand(1, 28));

                        $paiement = Paiement::create([
                            'bien_id' => $bien->id,
                            'mois' => $mois,
                            'annee' => $anneeActuelle,
                            'montant' => 50.00,
                            'date_paiement' => $datePaiement,
                            'date_echeance' => $dateEcheance,
                            'statut' => $datePaiement->gt($dateEcheance) ? 'en_retard' : 'paye',
                        ]);

                        // Créer un reçu
                        Recu::create([
                            'paiement_id' => $paiement->id,
                            'numero_recu' => Recu::generateNumero(),
                            'date_emission' => $datePaiement,
                            'montant_total' => $paiement->montant,
                        ]);

                        // 20% de chance d'avoir des frais supplémentaires
                        if (rand(1, 100) <= 20) {
                            Frais::create([
                                'bien_id' => $bien->id,
                                'paiement_id' => $paiement->id,
                                'description' => 'Frais de maintenance',
                                'montant' => rand(1, 5) * 10,
                                'date_frais' => $datePaiement,
                                'paye' => true,
                            ]);
                        }
                    }
                }
            }
        }

        // Créer des dépenses
        $categoriesDepenses = ['Électricité', 'Eau', 'Nettoyage', 'Réparation', 'Jardinage', 'Sécurité'];
        $descriptionsDepenses = [
            'Facture électricité parties communes',
            'Facture eau parties communes',
            'Service de nettoyage mensuel',
            'Réparation ascenseur',
            'Entretien jardin',
            'Service gardiennage',
            'Réparation porte entrée',
            'Peinture cage escalier',
            'Remplacement ampoules',
            'Maintenance interphone',
        ];

        for ($i = 0; $i < 15; $i++) {
            Depense::create([
                'description' => $descriptionsDepenses[array_rand($descriptionsDepenses)],
                'montant' => rand(5, 50) * 10,
                'date_depense' => Carbon::now()->subDays(rand(1, 180)),
                'categorie' => $categoriesDepenses[array_rand($categoriesDepenses)],
            ]);
        }
    }
}
