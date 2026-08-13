# geobas-portal

GeoBas återvändarportal — tredje designvarianten (civic-modern).

## Designfilosofi

Ljus, optimistisk och "civic wayfinding"-inspirerad variant: varm pappersbotten,
djup teal + bärnstensaccenter, Archivo/Inter/JetBrains Mono-typografi, numrerade
steg (1–3), och en ren inline-SVG "rutt"-illustration i herot i stället för
3D-jordgloben. Medvetet helt annorlunda mot den mörka editorial-atlas-varianten.

## Språk

Svenska (standard), engelska, spanska och arabiska. Arabiska aktiverar korrekt
RTL (`dir="rtl"`) samt Noto Kufi/Sans Arabic-typsnitt. Region- och landsnamn är
översatta till alla fyra språk; kartinnehållet förblir svenskt (visas med
"Ej översatt"-notis i andra språk tills det översätts i redigeringsläget).

## Redigering (CKEditor-modal)

Redigeringsläget öppnar en modal med CKEditor 4 (laddas från CDN) förladdad med
aktuellt innehåll — landsintroduktioner och kort (rubrik + rik text + faktarutor).
Sparning sker genom en konservativ HTML-sanerare (whitelist av taggar, endast
http(s)/mailto-länkar med rel=noopener). Om CKEditor inte kan laddas (offline)
faller modalen tillbaka på en vanlig textarea med samma sanering.

## Arkitektur

Browser-only och offlinevänligt: SQLite via sql.js i webbläsaren, persistens via
`window.storage` (om värdmiljön erbjuder det) annars localStorage, export/import
av .sqlite. Inga externa bilder eller tunga bibliotek — endast sql.js, CKEditor
och Google Fonts från CDN. Den senare one-file dependency-bundling-uppgiften är
medvetet inte utförd här.
