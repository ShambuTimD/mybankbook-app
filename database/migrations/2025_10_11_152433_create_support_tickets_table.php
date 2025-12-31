<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();

            // Ticket reference number
            $table->string('ticket_id')->unique();

            // Customer (Company User)
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')
                ->references('id')
                ->on('timd_hpbms_comp_users')
                ->nullOnDelete();

            // Ticket details
            $table->string('subject');
            $table->string('category')->nullable();
            $table->enum('priority', ['Low', 'Medium', 'High'])->default('Medium');
            $table->text('description')->nullable();

            // Ticket status
            $table->enum('status', ['Open', 'In Progress', 'Resolved', 'Closed'])
                  ->default('Open');

            // Assigned support staff (also a Company User, optional)
            $table->unsignedBigInteger('assigned_to')->nullable();
            $table->foreign('assigned_to')
                ->references('id')
                ->on('timd_hpbms_comp_users')
                ->nullOnDelete();

            // Admin who created ticket
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Admin who last updated ticket
            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
