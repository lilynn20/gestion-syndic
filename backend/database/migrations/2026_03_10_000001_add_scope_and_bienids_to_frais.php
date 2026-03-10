<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('frais', function (Blueprint $table) {
            // Add scope: global, appartments, garages, custom
            $table->string('scope')->default('single')->after('is_global');
            // Store selected bien ids for custom scope
            $table->json('bien_ids')->nullable()->after('scope');
        });
    }

    public function down(): void
    {
        Schema::table('frais', function (Blueprint $table) {
            $table->dropColumn(['scope', 'bien_ids']);
        });
    }
};
