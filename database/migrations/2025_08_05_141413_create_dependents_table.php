<?php

// database/migrations/2025_08_05_000001_create_dependents_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // public function up(): void {
    //     Schema::create('timd_hpbms_dependents', function (Blueprint $table) {
    //         $table->id();
    //         $table->unsignedBigInteger('emp_id');
    //         $table->unsignedBigInteger('company_id');

    //         $table->string('name');
    //         $table->enum('gender', ['male', 'female', 'other'])->nullable();
    //         $table->integer('age')->nullable();
    //         $table->string('relation')->nullable(); // spouse, son, daughter
    //         $table->string('phone')->nullable();
    //         $table->string('email')->nullable();
    //         $table->text('medical_conditions')->nullable();
    //         $table->text('remarks')->nullable();
    //         $table->enum('status', ['active', 'inactive'])->default('active');
    //         // $table->json('conditions')->nullable();
    //         // $table->string('other_condition')->nullable();
    //         $table->timestamps();

    //         $table->foreign('emp_id')->references('id')->on('employees')->onDelete('cascade');
    //         $table->foreign('company_id')->references('id')->on('timd_hpbms_companies')->onDelete('cascade');
    //     });
    // }

    // public function down(): void {
    //     Schema::dropIfExists('timd_hpbms_dependents');
    // }
};
