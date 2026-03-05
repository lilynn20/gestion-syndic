<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reçu de Paiement - {{ $recu->numero_recu }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header p {
            color: #666;
        }
        .recu-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .recu-numero {
            background-color: #f3f4f6;
            padding: 10px 15px;
            border-radius: 5px;
        }
        .recu-numero strong {
            color: #2563eb;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background-color: #2563eb;
            color: white;
            padding: 8px 15px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .info-grid {
            display: table;
            width: 100%;
        }
        .info-row {
            display: table-row;
        }
        .info-label {
            display: table-cell;
            padding: 5px 10px;
            font-weight: bold;
            width: 40%;
            background-color: #f9fafb;
        }
        .info-value {
            display: table-cell;
            padding: 5px 10px;
        }
        .montant-section {
            background-color: #f0fdf4;
            border: 2px solid #22c55e;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .montant-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .montant-value {
            font-size: 28px;
            font-weight: bold;
            color: #22c55e;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .signature {
            margin-top: 40px;
            text-align: right;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin-left: auto;
            margin-top: 50px;
            padding-top: 5px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SYNDIC DE COPROPRIÉTÉ</h1>
        <p>Reçu de Paiement</p>
    </div>

    <div class="recu-info">
        <div class="recu-numero">
            <strong>Reçu N° :</strong> {{ $recu->numero_recu }}
        </div>
        <div>
            <strong>Date d'émission :</strong> {{ $recu->date_emission->format('d/m/Y') }}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Informations du Propriétaire</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nom complet</div>
                <div class="info-value">{{ $proprietaire->prenom }} {{ $proprietaire->nom }}</div>
            </div>
            @if($proprietaire->email)
            <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">{{ $proprietaire->email }}</div>
            </div>
            @endif
            @if($proprietaire->telephone)
            <div class="info-row">
                <div class="info-label">Téléphone</div>
                <div class="info-value">{{ $proprietaire->telephone }}</div>
            </div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">Informations du Bien</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Type</div>
                <div class="info-value">{{ ucfirst($bien->type) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Numéro</div>
                <div class="info-value">{{ $bien->numero }}</div>
            </div>
            @if($bien->adresse)
            <div class="info-row">
                <div class="info-label">Adresse</div>
                <div class="info-value">{{ $bien->adresse }}</div>
            </div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">Détails du Paiement</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Période</div>
                <div class="info-value">{{ $paiement->mois_nom }} {{ $paiement->annee }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date de paiement</div>
                <div class="info-value">{{ $paiement->date_paiement->format('d/m/Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Cotisation mensuelle</div>
                <div class="info-value">{{ number_format($paiement->montant, 2) }} DH</div>
            </div>
            @if($paiement->frais)
            <div class="info-row">
                <div class="info-label">Frais supplémentaires</div>
                <div class="info-value">{{ number_format($paiement->frais->montant, 2) }} DH ({{ $paiement->frais->description }})</div>
            </div>
            @endif
        </div>
    </div>

    <div class="montant-section">
        <div class="montant-label">MONTANT TOTAL PAYÉ</div>
        <div class="montant-value">{{ number_format($recu->montant_total, 2) }} DH</div>
    </div>

    <div class="signature">
        <p>Le Syndic</p>
        <div class="signature-line">Signature et cachet</div>
    </div>

    <div class="footer">
        <p>Ce reçu est généré automatiquement et fait foi de paiement.</p>
        <p>Conservez ce document pour vos archives.</p>
    </div>
</body>
</html>
