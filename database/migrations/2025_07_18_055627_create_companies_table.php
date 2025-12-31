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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->unique();
            $table->string('brand_title')->nullable();
            $table->string('company_address')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_acc_number')->unique();
            $table->string('bank_ifsc')->nullable();
            $table->string('gstin')->unique();
            $table->string('logo')->nullable();
            $table->enum('status',['active','inactive'])->default('active')->nullable();
            $table->timestamps();
              $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
