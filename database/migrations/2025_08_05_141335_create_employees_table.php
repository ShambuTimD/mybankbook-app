<?php

// database/migrations/2025_08_05_000000_create_employees_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('office_location')->nullable();
            $table->date('appointment_date')->nullable();
            $table->string('employee_id')->nullable();
            $table->string('name');
            $table->string('designation')->nullable();
            $table->integer('age')->nullable();
            $table->string('gender')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->json('conditions')->nullable();
            $table->string('other_condition')->nullable();

            $table->boolean('has_dependents')->default(false);
            $table->boolean('agreed')->default(false);
            $table->string('captcha')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('employees');
    }
};
