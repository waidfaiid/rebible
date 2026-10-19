# Learning Logics

## Lernphasen eines Verses (Modus 1: Stelle → Text)

```
Warteliste (neu) → Werkstatt (lernen) → Langzeit
                       ↑                    │
                       └─ komplett vergessen┘
```

1. **Warteliste** – neu angelegte Verse sind noch nicht fällig.
2. **Werkstatt** – höchstens 3 Verse gleichzeitig. Freie Plätze werden beim Öffnen der Werkstatt
   automatisch mit den ältesten Versen der Warteliste gefüllt. Ein Vers wird in der Sitzung so lange
   wiederholt, bis er wortgetreu sitzt. „Vergessen“ setzt die gesammelten Tage auf 0 zurück.
   Ist er **an 2 verschiedenen Tagen wortgetreu** gekonnt, wechselt er in die Langzeit
   (erste Wiederholung nach 3 Tagen).
3. **Langzeit** – Wiederholung nach dem Anki-Prinzip (Startfaktor 2,5, mindestens 1,3):

| Knopf | entspricht Anki | neuer Abstand | Faktor |
|---|---|---|---|
| Vergessen | Nochmal | zurück in die Werkstatt | −0,20 |
| Lückenhaft | Schwer | Abstand × 1,2 | −0,15 |
| Inhaltlich gut | Gut | Abstand × Faktor | ± 0 |
| Wortgetreu | Leicht | Abstand × Faktor × 1,3 | +0,15 |

Wer zu spät wiederholt und den Vers trotzdem kann, bekommt die Verspätung (anteilig) angerechnet.
Ab 3 Tagen werden die Abstände um ±5 % gestreut, damit sich Verse nicht auf einzelne Tage ballen.

Modus 2, 4 und „Tägliches Training“ zeigen nur Verse in der Langzeit-Phase.
Modus 3 (Buch/Kontext) zeigt alle Verse, weil er beim Einprägen hilft.

Code: `src/lib/werkstatt.ts`, `src/lib/spacedRepetition.ts` (`ankiLangzeit`).

## Anki-Import

- Karte 1 einer Notiz (Stelle → Text) → Modus 1, Karte 2 (umgekehrt) → Modus 2.
- Übernommen werden Faktor, Abstand, Fälligkeitsdatum, Anzahl Wiederholungen und die letzte
  Wiederholung (aus Ankis Wiederholungsprotokoll).
- Anki-Zustand → Phase: neu/ausgesetzt → Warteliste, lernen/neu lernen → Werkstatt, wiederholen → Langzeit.
- Bereits vorhandene Verse werden ergänzt, nicht überschrieben (manuelle Abschnitte, Modus 3/4 bleiben).
- Neue (.anki21b, komprimiert) und alte Exportformate werden gelesen.
