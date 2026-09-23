CREATE TABLE "acceso_paciente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid NOT NULL,
	"token" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "acceso_paciente_paciente_id_unique" UNIQUE("paciente_id"),
	CONSTRAINT "acceso_paciente_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "clinica" ADD COLUMN "telefono" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "acceso_paciente" ADD CONSTRAINT "acceso_paciente_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE cascade ON UPDATE no action;