<?php

namespace App\Console\Commands;

use App\Models\Paiement;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendPaymentReminders extends Command
{
    protected $signature = 'reminders:send {--dry-run}';
    protected $description = 'Send WhatsApp reminders for due payments';

    public function handle(WhatsAppService $whatsapp): void
    {
        $dryRun = $this->option('dry-run');

        $today = Carbon::today();
        $threeDaysLater = $today->copy()->addDays(3);

        $paiements = Paiement::with(['bien.proprietaire'])
            ->where('statut', 'en_retard')
            ->whereBetween('date_echeance', [$today, $threeDaysLater])
            ->get();

        $this->info("Found {$paiements->count()} payments due soon.");

        foreach ($paiements as $paiement) {
            $proprietaire = $paiement->bien?->proprietaire;

            if (!$proprietaire || !$proprietaire->telephone) {
                $this->warn("Skipping #{$paiement->id} - no phone number.");
                continue;
            }

            if ($dryRun) {
                $this->info("[DRY RUN] Would send to {$proprietaire->full_name} ({$proprietaire->telephone})");
                continue;
            }

            $sent = $whatsapp->sendReminder(
                $proprietaire->telephone,
                $proprietaire->full_name,
                $paiement->mois_nom . ' ' . $paiement->annee,
                $paiement->montant
            );

            if ($sent) {
                $this->info("✓ Sent to {$proprietaire->full_name}");
            }
        }
    }
}