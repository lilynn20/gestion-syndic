<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu {{ $recu->numero_recu }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #000;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 18px;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .header p {
            margin: 0;
            font-size: 11px;
        }
        .recu-info {
            margin-bottom: 25px;
            border: 1px solid #000;
            padding: 10px;
        }
        .row {
            margin-bottom: 8px;
        }
        .row:last-child {
            margin-bottom: 0;
        }
        .label {
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .total-row {
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            margin-top: 50px;
        }
        .signature {
            float: right;
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 60px;
            padding-top: 5px;
        }
        .note {
            margin-top: 80px;
            font-size: 10px;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reçu de Paiement</h1>
        <p>Syndic de Copropriété</p>
    </div>

    <div class="recu-info">
        <div class="row">
            <span class="label">Reçu N° :</span> {{ $recu->numero_recu }}
        </div>
        <div class="row">
            <span class="label">Date :</span> {{ $recu->date_emission->format('d/m/Y') }}
        </div>
    </div>

    <div class="row">
        <span class="label">Propriétaire :</span> {{ $proprietaire->prenom }} {{ $proprietaire->nom }}
    </div>
    @if($proprietaire->telephone)
    <div class="row">
        <span class="label">Tél :</span> {{ $proprietaire->telephone }}
    </div>
    @endif
    <div class="row">
        <span class="label">Bien :</span> {{ ucfirst($bien->type) }} N° {{ $bien->numero }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th style="width: 100px; text-align: right;">Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Cotisation {{ $paiement->mois_nom }} {{ $paiement->annee }}</td>
                <td style="text-align: right;">{{ number_format($paiement->montant, 2) }} DH</td>
            </tr>
            @if($paiement->frais)
            <tr>
                <td>{{ $paiement->frais->description }}</td>
                <td style="text-align: right;">{{ number_format($paiement->frais->montant, 2) }} DH</td>
            </tr>
            @endif
            <tr class="total-row">
                <td>Total</td>
                <td style="text-align: right;">{{ number_format($recu->montant_total, 2) }} DH</td>
            </tr>
        </tbody>
    </table>

    <div class="row">
        <span class="label">Date de paiement :</span> {{ $paiement->date_paiement->format('d/m/Y') }}
    </div>

    <div class="footer">
        <div class="signature">
            <p>Le Syndic</p>
            <div class="signature-line">Signature</div>
        </div>
    </div>

    <div class="note">
        Ce reçu fait foi de paiement.
    </div>
</body>
</html>
