# StudyGo Importer (Export Contract v1)

Deze importer maakt het mogelijk om leermateriaal geëxporteerd vanuit StudyGo (v1) automatisch te importeren in het "Complete Learning Platform". De importer volgt een manifest-first benadering en is volledig idempotent.

## Gebruik

De importer kan worden uitgevoerd via het CLI command in de `api` workspace.

### Commands

**Dry Run (Aanbevolen eerste stap):**
Draait de import zonder wijzigingen in de database aan te brengen. Genereert een rapport met wat er *zou* gebeuren.
```bash
npm run import-studygo -- --path /pad/naar/export --dry-run
```

**Commit:**
Voert de daadwerkelijke import uit en schrijft gegevens naar de database en assets naar de storage.
```bash
npm run import-studygo -- --path /pad/naar/export --commit
```

### Opties
- `--path, -p`: Pad naar de map met `export_manifest.json`.
- `--dry-run, -d`: Alleen simulatie, geen DB writes.
- `--commit, -c`: Schrijf naar database en kopieer assets.
- `--assets, -a`: Doelmap voor afbeeldingen (standaard: `./public/assets/studygo`).

## Gegevens Mapping

De importer mapt StudyGo entiteiten als volgt:

| StudyGo Entiteit | Platform Entiteit | Opmerking |
| :--- | :--- | :--- |
| **Subject** | `subjects` | Gekoppeld via `source_id` (subjectId). |
| **Book** | `books` | Nieuwe tabel, gekoppeld aan subject. |
| **Chapter** | `chapters` | Gekoppeld via `source_id` (chapterIdOrIdx + path). |
| **Section** | `paragraphs` | Structuur node binnen een hoofdstuk. |
| **Terms** | `leersets` | Mapt naar flashcards/sets. |
| **Summary/Theory** | `documents` | HTML content met asset rewrite naar `/assets/studygo/`. |
| **Questions** | `practice_questions` | Mapt naar MCQ/Input vragen. |
| **Exams** | `quizzes` | Quizzen van type 'exam'. |

## Idempotency & Deduplicatie

- Voor elke entiteit wordt een `source_id` kolom gebruikt (toegevoegd via migratie).
- De importer gebruikt een `UPSERT` logica op basis van deze `source_id`.
- Als je dezelfde export opnieuw draait, worden bestaande records bijgewerkt in plaats van gedupliceerd.

## Rapportage & Logging

- **import_report.json**: Bevat een samenvatting van het aantal geïmporteerde items, successtatus en eventuele fouten/waarschuwingen.
- **import_log.jsonl**: Gedetailleerd logbestand (JSON Lines format) van elke stap in het importproces.

## Assets
Afbeeldingen in HTML/Markdown worden automatisch gedownload naar de opgegeven asset map. De `src` attributen in de content worden herschreven naar `/assets/studygo/[bestandsnaam]`.
