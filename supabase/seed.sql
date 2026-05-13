insert into public.events (
  id,
  slug,
  name,
  subtitle,
  description,
  event_date,
  status,
  moderator_questions,
  common_themes
)
values (
  '11111111-1111-1111-1111-111111111111',
  'affarsresans-ekosystem',
  'Affärsresans ekosystem',
  'Business Travel Insight Lab',
  'En AI-stödd workshop där leverantörer och resebyråer tillsammans identifierar friktion, möjligheter och konkreta förbättringar för Travel Managers och affärsresenärer.',
  null,
  'active',
  array[
    'Vem borde äga verifieringen av att ett kundunikt avtal är korrekt laddat?',
    'Vilken friktion påverkar Travel Manager mest: pris, policy, betalning, uppföljning eller support?',
    'Vad kan standardiseras mellan resebyråer och leverantörer utan att ta bort flexibilitet?',
    'Vilken förbättring skulle vara enklast att testa med en pilotkund inom 60 dagar?'
  ],
  array[
    'Otydligt processägarskap',
    'Brist på gemensam validering',
    'Skillnader mellan hotell, flyg och tåg',
    'Travel Manager saknar ibland enkel kontrollvy',
    'Behov av tydligare uppföljning och ansvarsfördelning'
  ]
);

insert into public.questions (
  event_id,
  response_key,
  title,
  description,
  placeholder,
  sort_order
)
values
(
  '11111111-1111-1111-1111-111111111111',
  'currentState',
  '1. Beskriv nuläget',
  'Hur fungerar detta idag från kundens, resebyråns och leverantörens perspektiv?',
  'Beskriv hur processen fungerar idag, vilka parter som är inblandade och vad som brukar hända i praktiken...',
  1
),
(
  '11111111-1111-1111-1111-111111111111',
  'friction',
  '2. Identifiera friktion',
  'Var går det långsamt, blir fel, skapar osäkerhet eller kräver manuell hantering?',
  'Beskriv var friktionen uppstår, vem som påverkas och vad konsekvensen blir...',
  2
),
(
  '11111111-1111-1111-1111-111111111111',
  'improvements',
  '3. Föreslå förbättringar',
  'Vilka idéer skulle göra störst skillnad för Travel Manager, resenärer, resebyråer och leverantörer?',
  'Skriv konkreta förbättringsförslag, möjliga ägare och nästa steg...',
  3
);

insert into public.workshop_groups (
  id,
  event_id,
  slug,
  name,
  access_code,
  topic_title,
  topic_description,
  status,
  participants,
  progress
)
values
(
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'neg-rates',
  'Grupp 1',
  'G1',
  'Laddning av avtalspriser / neg rates',
  'Hur kan resebyråer och leverantörer skapa en tydligare, mer verifierbar och mindre personberoende process för laddning, kontroll och uppföljning av kundunika avtalspriser?',
  'Aktiv',
  5,
  68
),
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'travel-manager-control',
  'Grupp 2',
  'G2',
  'Travel Managerns kontroll och uppföljning',
  'Hur kan Travel Manager enklare följa upp att policy, avtalade priser, hållbarhetsmål och betalflöden fungerar i praktiken?',
  'Aktiv',
  4,
  52
),
(
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'online-offline',
  'Grupp 3',
  'G3',
  'Bokningsflöde online och offline',
  'Vilka skillnader finns mellan agentbokning via telefon/mail och självbokning online, och var uppstår tapp i kvalitet, styrning eller kundupplevelse?',
  'Inte startad',
  0,
  10
),
(
  '22222222-2222-2222-2222-222222222224',
  '11111111-1111-1111-1111-111111111111',
  'policy-sustainability',
  'Grupp 4',
  'G4',
  'Policy, hållbarhet och beteendestyrning',
  'Hur kan leverantörer, resebyråer och betallösningar tillsammans göra det enklare för företagskunder att styra resor enligt policy, hållbarhet och kostnadsmål?',
  'Redo för sammanfattning',
  5,
  86
);

insert into public.responses (group_id, response_key, content)
values
(
  '22222222-2222-2222-2222-222222222221',
  'currentState',
  'Processen skiljer sig mellan hotell, flyg och tåg. För hotell kan Travel Manager ibland själv initiera laddningsinstruktioner, medan flyg och tåg ofta kräver mer supportinblandning.'
),
(
  '22222222-2222-2222-2222-222222222221',
  'friction',
  'Det är inte alltid tydligt vem som äger kontrollen av att rätt pris faktiskt är laddat, synligt och bokningsbart i rätt kanal.'
),
(
  '22222222-2222-2222-2222-222222222221',
  'improvements',
  'Skapa en gemensam valideringschecklista som kan användas före avtalsstart och vid större förändringar.'
),
(
  '22222222-2222-2222-2222-222222222222',
  'currentState',
  'Travel Manager får ofta uppföljning i efterhand, men saknar ibland tydlig realtidskontroll över om rätt avtal och rätt betalflöde används vid bokning.'
),
(
  '22222222-2222-2222-2222-222222222222',
  'friction',
  'Uppföljning kräver ofta flera rapporter eller kontaktpunkter. Det är inte alltid enkelt att veta om felet ligger hos byrå, leverantör, betalflöde eller bokningskanal.'
),
(
  '22222222-2222-2222-2222-222222222222',
  'improvements',
  'Skapa en tydligare kontrollvy där Travel Manager kan se avtalstrohet, policyavvikelser och betalflöde på en mer samlad nivå.'
),
(
  '22222222-2222-2222-2222-222222222224',
  'currentState',
  'Policy, hållbarhetsval och kostnadsmål syns inte alltid tillräckligt tydligt i bokningsögonblicket.'
),
(
  '22222222-2222-2222-2222-222222222224',
  'friction',
  'Resenären får ibland för lite vägledning i själva bokningsflödet och Travel Manager får arbeta mer med uppföljning i efterhand.'
),
(
  '22222222-2222-2222-2222-222222222224',
  'improvements',
  'Visualisera hållbara alternativ, policyinformation och kostnadseffekt tydligare i bokningsflödet.'
);

insert into public.insight_cards (
  id,
  group_id,
  title,
  problem,
  consequence,
  root_cause,
  idea,
  impact,
  difficulty,
  suggested_owner,
  next_step,
  votes,
  ai_generated
)
values
(
  '33333333-3333-3333-3333-333333333331',
  '22222222-2222-2222-2222-222222222221',
  'Gemensam valideringschecklista',
  'Det saknas en gemensam miniminivå för hur laddade avtalade priser kontrolleras.',
  'Risk för fel pris, mer support och lägre förtroende hos Travel Manager.',
  'Olika aktörer arbetar med olika instruktioner, roller och kontrollpunkter.',
  'Ta fram en enkel checklista som kan användas av leverantör, resebyrå och Travel Manager före avtalsstart.',
  'Hög',
  'Medel',
  'Leverantörer + resebyråer',
  'Ta fram ett första utkast och testa med en pilotkund och två leverantörer.',
  3,
  false
),
(
  '33333333-3333-3333-3333-333333333332',
  '22222222-2222-2222-2222-222222222221',
  'Tydligare processägarskap',
  'Det är otydligt vem som ansvarar för instruktion, laddning, verifiering och uppföljning.',
  'Problem upptäcks ofta först när bokningen ska göras eller när kunden följer upp i efterhand.',
  'Processen är uppdelad mellan kund, resebyrå, leverantör och teknisk support.',
  'Definiera tydliga roller i processen och skapa en gemensam ansvarsmatris.',
  'Hög',
  'Medel',
  'Resebyrå + leverantör',
  'Kartlägg nuvarande ansvarsfördelning för hotell, flyg och tåg var för sig.',
  2,
  false
),
(
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'Bättre kontrollvy för avtalsanvändning',
  'Travel Manager saknar ofta en enkel överblick över om avtal, policy och betalflöde fungerar som tänkt.',
  'Det blir svårare att styra kostnad, följa upp avtalstrohet och förklara avvikelser internt.',
  'Data finns ofta utspridd mellan bokningssystem, leverantör, resebyrå och betalpartner.',
  'Identifiera den minsta datamängd Travel Manager behöver för att följa upp avtalstrohet.',
  'Hög',
  'Hög',
  'Resebyrå + betalpartner + leverantörer',
  'Definiera vilka 5–7 datapunkter som är viktigast för Travel Manager.',
  1,
  false
),
(
  '33333333-3333-3333-3333-333333333334',
  '22222222-2222-2222-2222-222222222224',
  'Policy som vägledning, inte hinder',
  'Policy upplevs ofta som kontroll i efterhand snarare än stöd i bokningsögonblicket.',
  'Resenärer kan göra val som avviker från policy utan att förstå konsekvensen.',
  'Policyinformation är inte alltid tillräckligt integrerad eller pedagogiskt presenterad i bokningsflödet.',
  'Kartlägg var i bokningsflödet resenären behöver guidning snarare än efterhandskontroll.',
  'Medel',
  'Medel',
  'Resebyrå + leverantörer',
  'Välj ett bokningsscenario och testa hur policyinformation kan presenteras tydligare.',
  2,
  false
);