-- Convert contacts.state from free text to MalaysianState enum, normalizing known aliases.
ALTER TABLE "contacts" ADD COLUMN "state_enum" "MalaysianState";

UPDATE "contacts" SET "state_enum" = CASE lower(regexp_replace(trim("state"), '[.[:space:]]+', ' ', 'g'))
  WHEN 'johor' THEN 'JOHOR'::"MalaysianState"
  WHEN 'kedah' THEN 'KEDAH'::"MalaysianState"
  WHEN 'kelantan' THEN 'KELANTAN'::"MalaysianState"
  WHEN 'melaka' THEN 'MELAKA'::"MalaysianState"
  WHEN 'malacca' THEN 'MELAKA'::"MalaysianState"
  WHEN 'negeri sembilan' THEN 'NEGERI_SEMBILAN'::"MalaysianState"
  WHEN 'negeri_sembilan' THEN 'NEGERI_SEMBILAN'::"MalaysianState"
  WHEN 'n sembilan' THEN 'NEGERI_SEMBILAN'::"MalaysianState"
  WHEN 'pahang' THEN 'PAHANG'::"MalaysianState"
  WHEN 'penang' THEN 'PENANG'::"MalaysianState"
  WHEN 'pulau pinang' THEN 'PENANG'::"MalaysianState"
  WHEN 'png' THEN 'PENANG'::"MalaysianState"
  WHEN 'perak' THEN 'PERAK'::"MalaysianState"
  WHEN 'perlis' THEN 'PERLIS'::"MalaysianState"
  WHEN 'sabah' THEN 'SABAH'::"MalaysianState"
  WHEN 'sarawak' THEN 'SARAWAK'::"MalaysianState"
  WHEN 'selangor' THEN 'SELANGOR'::"MalaysianState"
  WHEN 'terengganu' THEN 'TERENGGANU'::"MalaysianState"
  WHEN 'kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'kuala_lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'kl' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'wp kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'w p kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'wilayah persekutuan kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'labuan' THEN 'LABUAN'::"MalaysianState"
  WHEN 'wp labuan' THEN 'LABUAN'::"MalaysianState"
  WHEN 'putrajaya' THEN 'PUTRAJAYA'::"MalaysianState"
  WHEN 'wp putrajaya' THEN 'PUTRAJAYA'::"MalaysianState"
  ELSE NULL
END
WHERE "state" IS NOT NULL;

-- Conversion summary (printed in migrate output via RAISE NOTICE)
DO $$
DECLARE total INT; converted INT; nulled INT;
BEGIN
  SELECT count(*) INTO total FROM "contacts" WHERE "state" IS NOT NULL;
  SELECT count(*) INTO converted FROM "contacts" WHERE "state" IS NOT NULL AND "state_enum" IS NOT NULL;
  nulled := total - converted;
  RAISE NOTICE 'Contact.state conversion: % had a value, % converted, % nulled (unrecognized)', total, converted, nulled;
END $$;

DROP INDEX IF EXISTS "contacts_state_idx";
ALTER TABLE "contacts" DROP COLUMN "state";
ALTER TABLE "contacts" RENAME COLUMN "state_enum" TO "state";
CREATE INDEX "contacts_state_idx" ON "contacts"("state");
