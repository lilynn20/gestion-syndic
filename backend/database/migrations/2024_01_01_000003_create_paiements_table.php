<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->integer('mois'); // 1-12
            $table->integer('annee');
            $table->decimal('montant', 10, 2);
            $table->date('date_paiement');
            $table->date('date_echeance');
            $table->enum('statut', ['paye', 'en_retard', 'avance'])->default('paye');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['bien_id', 'mois', 'annee']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
