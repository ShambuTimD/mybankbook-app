<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AlterRoleForEnumInRolesTable extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE roles MODIFY role_for ENUM('frontend', 'backend', 'others') NOT NULL DEFAULT 'backend'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE roles MODIFY role_for VARCHAR(255) NOT NULL DEFAULT 'user'");
    }
}
