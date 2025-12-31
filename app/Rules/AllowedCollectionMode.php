<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class AllowedCollectionMode implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed   $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        // Normalize to array
        if (is_array($value)) {
            $modes = $value;
        } elseif (is_string($value)) {
            $modes = explode(',', $value);
        } else {
            return false;
        }

        // Clean values: trim and remove empty + decode possible JSON fragments
        $modes = array_map(function ($item) {
            $item = trim($item, " \t\n\r\0\x0B\"[]"); // remove quotes/brackets
            return trim($item);
        }, $modes);

        $modes = array_filter($modes); // remove empty values

        if (empty($modes)) {
            return false;
        }

        $validModes = ['at_home', 'at_clinic'];

        foreach ($modes as $mode) {
            if (!in_array($mode, $validModes, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'The :attribute field contains invalid collection modes. Valid modes are: at_home, at_clinic.';
    }
}
