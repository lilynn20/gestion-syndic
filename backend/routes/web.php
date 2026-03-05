<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fallback login route for redirects (API uses JSON response instead)
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated. Please login.'], 401);
})->name('login');
