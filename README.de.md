# Mail-Statistik

Wie viele Mails deine Projekte verschicken – je Tag, je Projekt, je Absender und Empfänger. Daten aus dem Mail-Fänger.

Eine offizielle Erweiterung für [Hostwerk](https://github.com/Passimoritz/hostwerk-public).

## Funktionen

- Mails je Tag als Balken (7, 14 oder 30 Tage)
- Häufigste Projekte (Absender-Domain), Absender und Empfänger
- Kennzahlen: heute, ungelesen, Durchschnittsgröße
- Kachel für die Übersicht mit der Zahl von heute

## Installieren

In Hostwerk: **Apps → Erweiterungen → Marktplatz** → „Mail-Statistik“ → Installieren. Updates kommen von selbst.

## Rechte

- Abgefangene E-Mails lesen (nur Datum, Absender, Empfänger, Größe – Inhalte zeigt die Seite nie)

Seiten laufen abgeschottet (eigener Ursprung, keine fremden Skripte); alles, was etwas ändert, fragt vorher nach.

## Entwicklung

```bash
node --test tests/*.test.js            # Tests der Logik
node pfad/zu/hostwerk-public/sdk/check.js . --strict   # dieselbe Prüfung wie der Katalog
```

Die Logik steckt in `page/lib.js` (ohne DOM, getestet), die Seite in `page/app.js`. Ein Tag `vX.Y.Z` passend zu `manifest.json` veröffentlicht ein Release; der Hostwerk-Katalog übernimmt es.

English: [README.md](README.md) · Lizenz: MIT
