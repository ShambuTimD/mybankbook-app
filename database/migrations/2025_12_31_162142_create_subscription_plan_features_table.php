<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subscription_plan_features', function (Blueprint $table) {
            $table->id();

            $table->foreignId('subscription_plan_id')
                ->constrained('subscription_plans')
                ->cascadeOnDelete();

            $table->string('feature_key', 100);
            $table->string('feature_value', 100)->nullable();

            $table->timestamps();

            // ✅ Explicit short index name (FIX)
            $table->unique(
                ['subscription_plan_id', 'feature_key'],
                'sp_features_plan_feature_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plan_features');
    }
};
