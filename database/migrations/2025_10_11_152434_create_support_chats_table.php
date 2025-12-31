<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_chats', function (Blueprint $table) {
            $table->id();

            // Link to the ticket
            $table->foreignId('ticket_id')
                  ->constrained('support_tickets')
                  ->cascadeOnDelete();

            // Sender is a Company User — reference timd_hpbms_comp_users table
            $table->unsignedBigInteger('sender_id');
            $table->foreign('sender_id')
                  ->references('id')
                  ->on('timd_hpbms_comp_users')
                  ->cascadeOnDelete();

            // Message
            $table->text('message');
            $table->string('message_type')->default('text');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_chats');
    }
};
