<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Booking Export</title>
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
        }

        th,
        td {
            border: 1px solid #cccccc;
            padding: 6px;
            text-align: left;
        }

        th {
            background: #f2f2f2;
            font-weight: bold;
        }

        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0 6px 0;
        }

        .kv td:first-child {
            font-weight: bold;
            width: 220px;
        }
    </style>
</head>

<body>
    {{-- Master block --}}
    <div class="section-title">Booking Master</div>
    <table class="kv">
        <thead>
            <tr>
                <th>Field</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($master as $row)
                <tr>
                    <td>{{ $row['Field'] }}</td>
                    <td>{{ $row['Value'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <br />

    {{-- Details block --}}
    <div class="section-title">Booking Details</div>
    <table>
        <thead>
            <tr>
                <th>BOOKING ID</th>
                <th>BRN</th>
                <th>Applicant Type</th>
                <th>UARN</th>
                <th>Employee ID</th>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th>Employee Age</th>
                <th>Dependent ID</th>
                <th>Dependent Name</th>
                <th>Dependent Age</th>
                <th>Gender</th>
                <th>Medical Conditions</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Home Address</th>
                <th>Relation</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($details as $d)
                <tr>
                    <td>{{ $d['BOOKING ID'] }}</td>
                    <td>{{ $d['BRN'] }}</td>
                    <td>{{ $d['Applicant Type'] }}</td>
                    <td>{{ $d['UARN'] }}</td>
                    <td>{{ $d['Employee ID'] }}</td>
                    <td>{{ $d['Employee Code'] }}</td>
                    <td>{{ $d['Employee Name'] }}</td>
                    <td>{{ $d['Employee Age'] }}</td>
                    <td>{{ $d['Dependent ID'] }}</td>
                    <td>{{ $d['Dependent Name'] }}</td>
                    <td>{{ $d['Dependent Age'] }}</td>
                    <td>{{ $d['Gender'] }}</td>
                    <td>{{ $d['Medical Conditions'] }}</td>
                    <td>{{ $d['Phone'] }}</td>
                    <td>{{ $d['Email'] }}</td>
                    <td>{{ $d['Designation'] }}</td>
                    <td>{{ $d['Home Address'] }}</td>
                    <td>{{ $d['Relation'] }}</td>
                    <td>{{ $d['Remarks'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="16" style="text-align:center;">
                        No applicant details found for this booking.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>

</html>
