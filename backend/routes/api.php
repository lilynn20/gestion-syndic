<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProprietaireController;
use App\Http\Controllers\Api\BienController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\FraisController;
use App\Http\Controllers\Api\DepenseController;
use App\Http\Controllers\Api\RecuController;
use App\Http\Controllers\Api\DashboardController;

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    // Authentification
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/password', [AuthController::class, 'updatePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/tableau-paiements', [DashboardController::class, 'tableauPaiements']);
    Route::get('/dashboard/evolution', [DashboardController::class, 'evolutionPaiements']);

    // Propriétaires
    Route::apiResource('proprietaires', ProprietaireController::class);
    Route::get('/proprietaires/{proprietaire}/paiements', [ProprietaireController::class, 'paiements']);

    // Biens
    Route::apiResource('biens', BienController::class);
    Route::get('/biens/{bien}/paiements', [BienController::class, 'paiements']);
    Route::get('/biens/{bien}/statut-paiements', [BienController::class, 'statutPaiements']);

    // Paiements
    Route::apiResource('paiements', PaiementController::class);
    Route::post('/paiements/multiple', [PaiementController::class, 'storeMultiple']);
    Route::get('/paiements-statistiques', [PaiementController::class, 'statistiques']);

    // Frais
    Route::apiResource('frais', FraisController::class);

    // Dépenses
    Route::apiResource('depenses', DepenseController::class);
    Route::get('/depenses-statistiques', [DepenseController::class, 'statistiques']);
    Route::get('/depenses-categories', [DepenseController::class, 'categories']);

    // Reçus
    Route::get('/recus', [RecuController::class, 'index']);
    Route::get('/recus/{recu}', [RecuController::class, 'show']);
    Route::get('/recus/{recu}/download', [RecuController::class, 'downloadPdf']);
    Route::post('/recus/regenerate/{paiement}', [RecuController::class, 'regenerate']);
});
