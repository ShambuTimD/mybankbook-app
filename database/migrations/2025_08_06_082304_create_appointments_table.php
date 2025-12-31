<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAppointmentsTable extends Migration
{
    // public function up(): void
    // {
    //     Schema::create('appointments', function (Blueprint $table) {
    //         $table->id();
    //         $table->string('company_email');
    //         $table->string('office_location');
    //         $table->date('appointment_date')->nullable();
    //         $table->string('appointment_time')->nullable();
    //         $table->enum('booking_mode', ['Online', 'CSV'])->default('Online');
    //         $table->string('csv_file')->nullable(); // path to uploaded file if applicable
    //         $table->boolean('agreed')->default(false); // if terms are agreed
    //         $table->timestamps();
    //     });
    // }

    // public function down(): void
    // {
    //     Schema::dropIfExists('appointments');
    // }
}
