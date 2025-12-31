<?php

namespace App\Helpers;

class BookingHelper
{
    /**
     * Generate a unique BDN for an employee or dependent.
     */
    public static function generateBDN(
        string $fullName,
        string $applicantType = 'employee',
        ?int $dependentIndex = null,
        ?string $employeeBDN = null
    ): string {

        // ================================
        // 1️⃣ If dependent → append suffix
        // ================================
        if ($applicantType === 'dependent' && $employeeBDN) {
            $suffix = str_pad($dependentIndex ?? 1, 2, '0', STR_PAD_LEFT);

            return $employeeBDN.$suffix;
        }

        // ================================
        // 2️⃣ EMPLOYEE → create initials
        // ================================
        $fullName = trim($fullName);

        // Split name into words
        $parts = preg_split('/\s+/', $fullName);

        $firstWord = strtoupper(substr($parts[0], 0, 1));
        $lastWord = strtoupper(substr($parts[count($parts) - 1], 0, 1));

        // Final initials → First + Last letter
        $initials = $firstWord.$lastWord;

        // ================================
        // 3️⃣ Ensure unique 4-digit number
        // ================================
        do {
            $uniqueNum = rand(1000, 9999);
            $bdn = $initials.$uniqueNum;
        } while (\App\Models\BookingDetail::where('uarn', $bdn)->exists());

        return $bdn;
    }
}
