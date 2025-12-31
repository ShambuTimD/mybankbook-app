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
       Schema::table('companies', function (Blueprint $table) {
        $table->string('bank_name')->nullable()->change();
        $table->string('bank_acc_number')->nullable()->change();
        $table->string('bank_ifsc')->nullable()->change();
        $table->string('gstin')->nullable()->change();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
        $table->string('bank_name')->nullable(false)->change();
        $table->string('bank_acc_number')->nullable(false)->change();
        $table->string('bank_ifsc')->nullable(false)->change();
        $table->string('gstin')->nullable(false)->change();
    });
    }
};
