# Lions Adventskalender – Gewinner-Galerie

Kleine Seite zum Einbetten in Wix (iframe). Sie zeigt alle bisher geöffneten Türchen
und hebt das heutige hervor.

## Wie die Sperre funktioniert

- Die Bilder liegen nur **verschlüsselt** (AES-256-GCM) in `encrypted/` im Repo.
- Der Schlüssel liegt lokal in `.door-key` (nie committen!) und bei GitHub als Secret `DOOR_KEY`.
- Eine GitHub Action läuft im Dezember alle 30 Minuten. Sie entschlüsselt nur die Türchen bis
  zum heutigen Tag (Europe/Berlin) und veröffentlicht sie auf GitHub Pages.
- Bilder künftiger Tage liegen also gar nicht auf dem Webserver. URLs raten oder die eigene
  Uhr verstellen bringt nichts.

## Einmalig einrichten

1. Auf github.com ein **öffentliches** Repo anlegen (Pages ist bei privaten Repos kostenpflichtig;
   die Bilder sind ja verschlüsselt).
2. Hier im Ordner:
   ```sh
   git init -b main
   git add . && git status   # prüfen: kein input/, kein .door-key, keine .jpg!
   git commit -m "Adventskalender"
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
3. Repo → *Settings → Secrets and variables → Actions → New repository secret*:
   Name `DOOR_KEY`, Wert = Inhalt von `.door-key` (`pbcopy < .door-key`).
4. Repo → *Settings → Pages → Source*: **GitHub Actions**.
5. Repo → *Actions* → „Kalender veröffentlichen“ → *Run workflow*.
   Danach ist die Seite unter `https://<user>.github.io/<repo>/` erreichbar (HTTPS).
6. In Wix: *Hinzufügen → Einbetten → Website einbetten*, die URL eintragen.
   - Desktop: **632 × 940 px** (Bild 600 × 600 mit Rahmen + 3 Reihen Thumbnails am 24.12.; mit Testansicht-Banner ca. 980 px)
   - Mobil: Breite voll, Höhe ca. **720 px**
   - Der Hintergrund ist transparent. Die Schrift ist standardmäßig dunkelblau (für helle
     Hintergründe). Auf dunklem Hintergrund `?text=hell` an die URL hängen, z. B.
     `https://<user>.github.io/<repo>/?text=hell`

## Echte Bilder einspielen

```sh
node scripts/prepare.mjs pfad/zum/bilderordner   # braucht macOS (sips)
git add encrypted && git commit -m "Echte Türchen" && git push
```
Die Nummer wird aus der letzten Zahl im Dateinamen gelesen. Der vorhandene `.door-key`
wird weiterverwendet, das Secret bleibt also gültig. **`.door-key` gut aufheben.**

## Lokal ansehen

```sh
node scripts/build.mjs --date 2026-12-06
python3 -m http.server -d dist 8000   # → http://localhost:8000
```

## Einstellungen (`config.json`)

- `year`: Kalenderjahr
- `simulateDate`: **Testansicht**, z. B. `"2026-12-24"`. Zeigt die Türchen bis zu diesem Tag mit rotem
  „Testansicht“-Banner. Wirkt nur bis 29.11. und wird von `prepare.mjs` automatisch entfernt.
  Zum manuellen Beenden die Zeile löschen und pushen.
- `releaseHour`: ab welcher Stunde (Berliner Zeit) das Türchen des Tages erscheint, z. B. `0` oder `18`

## Hinweise

- GitHub deaktiviert geplante Actions nach 60 Tagen ohne Commit. Im November einmal pushen,
  z. B. die echten Bilder, dann läuft es sicher bis Weihnachten.
- Geplante Läufe können sich um einige Minuten verzögern. Ein neues Türchen erscheint daher
  meist in den ersten 30–60 Minuten nach `releaseHour`.
- Ein bereits veröffentlichtes Türchen lässt sich nicht „zurückholen“. Bilder daher vor
  dem 1. Dezember prüfen.
