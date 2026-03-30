<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $token;

    public function __construct()
    {
        $this->token = config('services.fonnte.token');
    }

    public function sendReminder(string $to, string $ownerName, string $month, float $amount): bool
    {
        $phone = $this->formatPhone($to);

        $response = Http::withHeaders([
            'Authorization' => $this->token,
        ])->withoutVerifying()->asForm()->post('https://api.fonnte.com/send', [
            'target' => $phone,
            'message' => "Bonjour {$ownerName},\n\nCeci est un rappel que votre paiement de *{$amount} MAD* pour le mois de *{$month}* est dû.\n\nMerci de régulariser votre situation.\n\n— Syndic Pro",
        ]);

        if ($response->failed()) {
            Log::error('Fonnte send failed', ['response' => $response->json()]);
            return false;
        }

        return true;
    }

    private function formatPhone(string $phone): string
    {
        $phone = preg_replace('/\s+/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '212' . substr($phone, 1);
        }
        return $phone;
    }
}