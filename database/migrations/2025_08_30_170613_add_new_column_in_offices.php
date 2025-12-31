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
        Schema::table('timd_hpbms_comp_offices', function (Blueprint $table) {
            $table->string('allowed_collection_mode')->default('at_clinic')->after('pincode')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timd_hpbms_comp_offices', function (Blueprint $table) {
            $table->dropColumn('allowed_collection_mode'); // Drop the column if it exists
        });
    }
};
