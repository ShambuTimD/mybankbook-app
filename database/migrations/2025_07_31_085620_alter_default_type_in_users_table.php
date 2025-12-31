<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class AlterDefaultTypeInUsersTable extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY type VARCHAR(255) NOT NULL DEFAULT 'backend'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY type VARCHAR(255) NOT NULL DEFAULT 'user'");
    }
}
