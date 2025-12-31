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
        Schema::table('support_tickets', function (Blueprint $table) {

            // 1. Drop existing foreign key constraint
            $table->dropForeign(['created_by']);

            // 2. Ensure column type matches referenced table
            // (uncomment if needed)
            // $table->unsignedBigInteger('created_by')->nullable()->change();

            // 3. Add the new FK referencing timd_hpbms_comp_users
            $table->foreign('created_by')
                ->references('id')
                ->on('timd_hpbms_comp_users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {

            // Rollback: drop the new foreign key
            $table->dropForeign(['created_by']);

            // Restore original FK to users table
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
