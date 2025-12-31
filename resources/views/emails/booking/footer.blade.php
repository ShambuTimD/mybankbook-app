@php
    use Illuminate\Support\Str;

    $abs = fn($path) => Str::startsWith((string)$path, ['http://','https://'])
        ? $path
        : (blank($path) ? '' : url($path));

    // Build the list safely (skip blanks)
    $items = [
        ['label' => 'Support',            'url' => $emailfooter->page_support ?? ''],
        ['label' => 'Terms & Conditions', 'url' => $emailfooter->page_terms_conditions ?? ''],
        ['label' => 'Disclaimer',         'url' => $emailfooter->page_disclaimer ?? ''],
        ['label' => 'Privacy Policy',     'url' => $emailfooter->page_privacy_policy ?? ''],
        ['label' => 'Unsubscribe',        'url' => $emailfooter->page_unsubscribe ?? ''],
        ['label' => 'Terms of Use',       'url' => $emailfooter->page_terms_of_use ?? ''],
        // Optional extras:
        // ['label' => 'Refund & Cancellation', 'url' => $emailfooter->page_return_policy ?? ''],
        // ['label' => 'Legal',                  'url' => $emailfooter->page_legal ?? ''],
    ];

    $links = array_values(array_filter(array_map(function ($i) use ($abs) {
        $u = $abs($i['url'] ?? '');
        return blank($u) ? null : ['label' => $i['label'], 'url' => $u];
    }, $items)));
@endphp

@if(count($links))
<p style="font-size:12px;color:#777;text-align:center;">
    @foreach($links as $idx => $l)
        <a href="{{ $l['url'] }}" style="color:#007bff;text-decoration:none;">{{ $l['label'] }}</a>@if($idx < count($links)-1) | @endif
    @endforeach
</p>
@endif
