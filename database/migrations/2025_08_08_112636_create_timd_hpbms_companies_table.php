<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('timd_hpbms_companies', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 255);
            $table->string('short_name', 255);
            $table->string('email', 255);
            $table->string('phone', 20);
            $table->string('alternate_phone', 20)->nullable();
            $table->string('website', 255)->nullable();
            $table->string('gst_number', 30)->nullable();
            $table->string('pan_number', 30)->nullable();
            $table->string('industry_type', 100)->nullable();
            $table->string('company_size', 50)->nullable();
            $table->string('registration_type', 50)->nullable();
            $table->string('address_line_1', 255);
            $table->string('address_line_2', 255)->nullable();
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('country', 100);
            $table->string('pincode', 20);
            $table->string('logo', 255)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('created_on')->nullable();
            $table->timestamp('updated_on')->nullable();
            $table->timestamp('deleted_on')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('timd_hpbms_companies');
    }
};
