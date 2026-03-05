<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Bien;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get all notifications (with unread first)
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::with(['bien', 'paiement'])
            ->orderBy('is_read', 'asc')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        $unreadCount = Notification::where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ]
        ]);
    }

    /**
     * Get unread count only
     */
    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count]
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue'
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        Notification::where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications marquées comme lues'
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Notification $notification): JsonResponse
    {
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée'
        ]);
    }

    /**
     * Generate notifications for overdue payments
     * This can be called manually or via a scheduled task
     */
    public function generateOverdueNotifications(): JsonResponse
    {
        $now = Carbon::now();
        $currentMonth = $now->month;
        $currentYear = $now->year;
        $generated = 0;

        // Get all biens with their proprietaires
        $biens = Bien::with('proprietaire')->get();

        foreach ($biens as $bien) {
            // Skip if bien has no date_adhesion or adhesion is after current month
            if ($bien->date_adhesion) {
                $adhesionDate = Carbon::parse($bien->date_adhesion);
                if ($adhesionDate->year > $currentYear || 
                    ($adhesionDate->year == $currentYear && $adhesionDate->month > $currentMonth)) {
                    continue;
                }
            }

            // Check last 3 months for unpaid
            for ($i = 0; $i < 3; $i++) {
                $checkDate = $now->copy()->subMonths($i);
                $mois = $checkDate->month;
                $annee = $checkDate->year;

                // Skip if before adhesion date
                if ($bien->date_adhesion) {
                    $adhesionDate = Carbon::parse($bien->date_adhesion);
                    if ($annee < $adhesionDate->year || 
                        ($annee == $adhesionDate->year && $mois < $adhesionDate->month)) {
                        continue;
                    }
                }

                // Check if payment exists for this month
                $paiementExists = Paiement::where('bien_id', $bien->id)
                    ->where('mois', $mois)
                    ->where('annee', $annee)
                    ->exists();

                if (!$paiementExists) {
                    // Check if notification already exists for this
                    $notifExists = Notification::where('type', 'payment_overdue')
                        ->where('bien_id', $bien->id)
                        ->where('message', 'like', "%$mois/$annee%")
                        ->exists();

                    if (!$notifExists) {
                        $moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                        
                        Notification::create([
                            'type' => 'payment_overdue',
                            'title' => 'Paiement en retard',
                            'message' => "Le bien {$bien->numero} ({$bien->proprietaire->prenom} {$bien->proprietaire->nom}) n'a pas payé pour {$moisNoms[$mois]} $annee ($mois/$annee)",
                            'bien_id' => $bien->id,
                            'is_read' => false,
                        ]);
                        $generated++;
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => "$generated nouvelles notifications générées"
        ]);
    }
}
