<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // public function up(): void
    // {
    //     Schema::table('timd_hpbms_bookings', function (Blueprint $table) {
    //         $table->date('appointment_date')->nullable()->after('preferred_date');
    //         $table->enum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed'])
    //             ->default('pending')->after('status');
    //         $table->string('reference_no')->unique()->after('booking_status');
    //         $table->string('csv_file')->nullable()->after('reference_no');
    //     });
    // }

    /**
     * Reverse the migrations.
     */
    // public function down(): void
    // {
    //     Schema::table('timd_hpbms_bookings', function (Blueprint $table) {
    //         $table->dropColumn(['appointment_date', 'booking_status', 'reference_no', 'csv_file']);
    //     });
    // }
};
