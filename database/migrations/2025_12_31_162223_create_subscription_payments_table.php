<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_subscription_id')
                ->constrained('user_subscriptions')
                ->cascadeOnDelete();

            $table->string('payment_reference', 150)->nullable();
            $table->string('payment_gateway', 50)->nullable();

            $table->decimal('amount', 10, 2);
            $table->string('currency', 10)->default('INR');

            $table->enum('payment_status', [
                'pending',
                'success',
                'failed',
                'refunded'
            ])->default('pending');

            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
