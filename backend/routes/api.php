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
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingController;

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    // Authentification
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/password', [AuthController::class, 'updatePassword']);

    // Search
    Route::get('/search', [SearchController::class, 'search']);

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
    Route::apiResource('frais', FraisController::class)->parameters(['frais' => 'frais']);
    Route::get('/frais-global-unpaid', [FraisController::class, 'getUnpaidGlobalFrais']);

    // Dépenses
    Route::apiResource('depenses', DepenseController::class);
    Route::get('/depenses-statistiques', [DepenseController::class, 'statistiques']);
    Route::get('/depenses-categories', [DepenseController::class, 'categories']);

    // Reçus
    Route::get('/recus', [RecuController::class, 'index']);
    Route::get('/recus/{recu}', [RecuController::class, 'show']);
    Route::post('/recus/regenerate/{paiement}', [RecuController::class, 'regenerate']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/generate-overdue', [NotificationController::class, 'generateOverdueNotifications']);
    Route::post('/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);
});

// Route publique pour télécharger le PDF (avec token en query param)
Route::get('/recus/{recu}/download', [RecuController::class, 'downloadPdf'])->name('recus.download');
