<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->constrained('proprietaires')->onDelete('cascade');
            $table->enum('type', ['appartement', 'magasin']);
            $table->string('numero');
            $table->string('adresse')->nullable();
            $table->decimal('cotisation_mensuelle', 10, 2)->default(50.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biens');
    }
};
