<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subscription_usage_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('feature_key', 100);
            $table->integer('usage_count')->default(0);

            $table->date('period_start');
            $table->date('period_end');

            $table->timestamps();

            $table->unique(['user_id', 'feature_key', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_usage_logs');
    }
};
