<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('subscription_plan_id')
                ->constrained('subscription_plans');

            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('trial_ends_at')->nullable();

            $table->enum('status', [
                'pending',
                'trial',
                'active',
                'expired',
                'cancelled'
            ])->default('pending');

            $table->boolean('auto_renew')->default(true);
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_subscriptions');
    }
};
