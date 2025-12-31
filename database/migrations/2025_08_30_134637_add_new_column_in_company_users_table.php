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
        Schema::table('timd_hpbms_comp_users', function (Blueprint $table) {
            $table->timestamp('last_login')->after('status')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timd_hpbms_comp_users', function (Blueprint $table) {
            $table->dropColumn('last_login'); // Drop the column if it exists
        });
    }
};
