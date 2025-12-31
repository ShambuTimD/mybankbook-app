<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tests', function (Blueprint $table) {
            $table->id();

            // Core Fields
            $table->string('test_code')->unique();
            $table->string('test_name');
            $table->foreignId('test_category_id')->constrained()->cascadeOnDelete();
            $table->enum('test_type', ['blood', 'urine', 'imaging', 'physical']);
            $table->string('sample_type')->nullable();
            $table->boolean('fasting_required')->default(false);
            $table->string('report_unit')->nullable();
            $table->string('normal_range')->nullable();
            $table->integer('tat_hours')->nullable();
            $table->text('description')->nullable();

            // ✅ Standard Status
            $table->enum('status', ['active', 'inactive'])->default('active');

            // ✅ Audit Fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            // ✅ Timestamps
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
