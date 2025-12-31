<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add column & FK in timd_hpbms_emps_offices
        Schema::table('timd_hpbms_emps', function (Blueprint $table) {
            if (!Schema::hasColumn('timd_hpbms_emps', 'booking_id')) {
                $table->unsignedBigInteger('booking_id')->nullable()->after('company_id');
            }
        });

        Schema::table('timd_hpbms_emp_dependents', function (Blueprint $table) {
            if (!Schema::hasColumn('timd_hpbms_emp_dependents', 'booking_id')) {
                $table->unsignedBigInteger('booking_id')->nullable()->after('emp_relation');
            }
        });

         // Add FK constraints
        Schema::table('timd_hpbms_emps', function (Blueprint $table) {
            $table->foreign('booking_id')
                  ->references('id')
                  ->on('timd_hpbms_booking_master')
                  ->onDelete('cascade');
        });

        Schema::table('timd_hpbms_emp_dependents', function (Blueprint $table) {
            $table->foreign('booking_id')
                  ->references('id')
                  ->on('timd_hpbms_booking_master')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timd_hpbms_emps', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });
        Schema::table('timd_hpbms_emp_dependents', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });
    }
};
