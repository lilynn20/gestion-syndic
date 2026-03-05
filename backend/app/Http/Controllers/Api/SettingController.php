<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Get all settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->mapWithKeys(function ($setting) {
            return [$setting->key => match($setting->type) {
                'number' => (float) $setting->value,
                'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
                'json' => json_decode($setting->value, true),
                default => $setting->value,
            }];
        });

        // Add defaults for missing settings
        $defaults = [
            'building_name' => 'Résidence El Fath',
            'building_address' => 'Casablanca, Maroc',
            'syndic_name' => 'SyndicPro',
            'syndic_email' => 'contact@syndicpro.ma',
            'syndic_phone' => '0522-123456',
            'default_cotisation' => 50,
            'payment_due_day' => 28,
            'currency' => 'DH',
        ];

        $merged = array_merge($defaults, $settings->toArray());

        return response()->json([
            'success' => true,
            'data' => $merged
        ]);
    }

    /**
     * Update settings
     */
    public function update(Request $request): JsonResponse
    {
        $settingsData = $request->validate([
            'building_name' => 'sometimes|string|max:255',
            'building_address' => 'sometimes|string|max:500',
            'syndic_name' => 'sometimes|string|max:255',
            'syndic_email' => 'sometimes|email|max:255',
            'syndic_phone' => 'sometimes|string|max:50',
            'default_cotisation' => 'sometimes|numeric|min:0',
            'payment_due_day' => 'sometimes|integer|min:1|max:28',
            'currency' => 'sometimes|string|max:10',
        ]);

        foreach ($settingsData as $key => $value) {
            $type = in_array($key, ['default_cotisation', 'payment_due_day']) ? 'number' : 'string';
            Setting::setValue($key, $value, $type);
        }

        return response()->json([
            'success' => true,
            'message' => 'Paramètres mis à jour avec succès'
        ]);
    }

    /**
     * Get a single setting
     */
    public function show(string $key): JsonResponse
    {
        $value = Setting::getValue($key);

        return response()->json([
            'success' => true,
            'data' => ['key' => $key, 'value' => $value]
        ]);
    }
}
