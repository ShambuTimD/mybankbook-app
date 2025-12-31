<?php

namespace App\Helpers;

class ApiResponseHelper
{
    public static function success($data = [], $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    public static function error($data = [], $message = 'Error', $errors = [], $code = 401)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $data,
            'errors' => $errors,
        ], $code);
    }
}
