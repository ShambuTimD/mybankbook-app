<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Export</title>
    <style>
        table { border-collapse: collapse; }
        th, td { border: 1px solid #cccccc; padding: 6px; }
        th { background: #f2f2f2; font-weight: bold; }
        .section-title { font-weight: bold; font-size: 14px; margin: 10px 0 6px 0; }
        .kv td:first-child { font-weight: bold; width: 220px; }
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
        @foreach($master as $row)
            <tr>
                <td>{{ $row['Field'] }}</td>
                <td>{{ $row['Value'] }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    {{-- Spacer --}}
    <br/>

    {{-- Details block --}}
    <div class="section-title">Booking Details</div>
    <table>
        <thead>
            <tr>
                <th>Applicant Type</th>
                <th>Employee ID</th>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th>Dependent ID</th>
                <th>Dependent Name</th>
                <th>Relationship</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Health Package ID</th>
                <th>Health Package Name</th>
                <th>Appointment Date</th>
                <th>Slot</th>
                <th>Appointment Location</th>
                <th>Address Line 1</th>
                <th>Address Line 2</th>
                <th>City</th>
                <th>State</th>
                <th>Pincode</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
        @forelse($details as $d)
            <tr>
                <td>{{ $d['Applicant Type'] }}</td>
                <td>{{ $d['Employee ID'] }}</td>
                <td>{{ $d['Employee Code'] }}</td>
                <td>{{ $d['Employee Name'] }}</td>
                <td>{{ $d['Dependent ID'] }}</td>
                <td>{{ $d['Dependent Name'] }}</td>
                <td>{{ $d['Relationship'] }}</td>
                <td>{{ $d['Gender'] }}</td>
                <td>{{ $d['DOB'] }}</td>
                <td>{{ $d['Phone'] }}</td>
                <td>{{ $d['Email'] }}</td>
                <td>{{ $d['Department'] }}</td>
                <td>{{ $d['Designation'] }}</td>
                <td>{{ $d['Health Package ID'] }}</td>
                <td>{{ $d['Health Package Name'] }}</td>
                <td>{{ $d['Appointment Date'] }}</td>
                <td>{{ $d['Slot'] }}</td>
                <td>{{ $d['Appointment Location'] }}</td>
                <td>{{ $d['Address Line 1'] }}</td>
                <td>{{ $d['Address Line 2'] }}</td>
                <td>{{ $d['City'] }}</td>
                <td>{{ $d['State'] }}</td>
                <td>{{ $d['Pincode'] }}</td>
                <td>{{ $d['Remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="24" style="text-align:center;">No applicant details found for this booking.</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
