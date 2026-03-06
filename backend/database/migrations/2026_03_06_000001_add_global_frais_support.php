<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('frais', function (Blueprint $table) {
            // Make bien_id nullable to support global frais
            $table->foreignId('bien_id')->nullable()->change();
            
            // Add flag for global frais (shared among all owners)
            $table->boolean('is_global')->default(false)->after('paye');
            
            // Track which biens have paid their share of global frais
            $table->json('paid_by_biens')->nullable()->after('is_global');
        });
    }

    public function down(): void
    {
        Schema::table('frais', function (Blueprint $table) {
            $table->dropColumn(['is_global', 'paid_by_biens']);
        });
    }
};
