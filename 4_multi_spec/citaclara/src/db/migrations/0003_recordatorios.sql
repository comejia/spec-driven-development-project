CREATE TYPE "public"."resultado_recordatorio" AS ENUM('enviado', 'simulado', 'omitido');--> statement-breakpoint
CREATE TABLE "recordatorio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cita_id" uuid NOT NULL,
	"generado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"resultado" "resultado_recordatorio" NOT NULL,
	"destino_email" text,
	CONSTRAINT "recordatorio_cita_unico" UNIQUE("cita_id")
);
--> statement-breakpoint
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_cita_id_cita_id_fk" FOREIGN KEY ("cita_id") REFERENCES "public"."cita"("id") ON DELETE cascade ON UPDATE no action;