<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Home route
Route::get('/', function () {
    return view('welcome');
});

// Fallback login route
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated. Please login.'], 401);
})->name('login');

// ----------------------
// WhatsApp Webhook Routes
// ----------------------

$VERIFY_TOKEN = env('WHATSAPP_VERIFY_TOKEN', 're_i3LKP7NG_3CwZtrXYgvF2x6kxsGyoVbSw');

// GET verification for Meta
Route::get('/webhook', function(Request $request) use ($VERIFY_TOKEN) {
    if ($request->input('hub_mode') === 'subscribe' &&
        $request->input('hub_verify_token') === $VERIFY_TOKEN) {
        return response($request->input('hub_challenge'), 200);
    }
    return response('Forbidden', 403);
});

// POST handler for incoming messages
Route::post('/webhook', function(Request $request) {
    // Log the payload to storage/logs/laravel.log
    \Log::info('Webhook received:', $request->all());

    // Respond 200 OK to acknowledge receipt
    return response('EVENT_RECEIVED', 200);
});