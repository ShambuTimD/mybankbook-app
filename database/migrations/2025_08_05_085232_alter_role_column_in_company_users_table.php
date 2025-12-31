<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterRoleColumnInCompanyUsersTable extends Migration
{
    // public function up()
    // {
    //     Schema::table('timd_hpbms_company_users', function (Blueprint $table) {
    //         // First drop existing string column
    //         $table->dropColumn('role');
    //     });

    //     Schema::table('timd_hpbms_company_users', function (Blueprint $table) {
    //         // Then re-add as unsignedBigInteger
    //         $table->unsignedBigInteger('role')->nullable()->after('mobile');

    //         // Add the foreign key constraint
    //         $table->foreign('role')->references('id')->on('roles')->onDelete('set null');
    //     });
    // }

    // public function down()
    // {
    //     Schema::table('timd_hpbms_company_users', function (Blueprint $table) {
    //         $table->dropForeign(['role']);
    //         $table->dropColumn('role');
    //         $table->string('role', 50)->nullable(); // rollback to string if needed
    //     });
    // }
}
