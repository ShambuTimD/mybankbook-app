<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // public function up(): void
    // {
    //     Schema::table('timd_hpbms_company_users', function (Blueprint $table) {
    //         $table->unsignedBigInteger('comp_office_id')->nullable()->after('company_id');

    //         $table->foreign('comp_office_id')
    //             ->references('id')
    //             ->on('timd_hpbms_comp_offices')
    //             ->onDelete('set null');
    //     });
    // }

    // public function down(): void
    // {
    //     Schema::table('timd_hpbms_company_users', function (Blueprint $table) {
    //         $table->dropForeign(['comp_office_id']);
    //         $table->dropColumn('comp_office_id');
    //     });
    // }
};
