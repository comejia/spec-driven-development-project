CREATE TYPE "public"."estado_cita" AS ENUM('reservada', 'completada', 'cancelada', 'no_asistida');--> statement-breakpoint
CREATE TABLE "cita" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"profesional_id" uuid NOT NULL,
	"servicio_id" uuid NOT NULL,
	"paciente_id" uuid NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone NOT NULL,
	"franja" "tstzrange" GENERATED ALWAYS AS (tstzrange(inicio, fin, '[)')) STORED,
	"estado" "estado_cita" DEFAULT 'reservada' NOT NULL,
	CONSTRAINT "cita_granularidad_5min" CHECK ((EXTRACT(EPOCH FROM "cita"."inicio")::numeric % 300) = 0),
	CONSTRAINT "cita_fin_posterior_a_inicio" CHECK ("cita"."fin" > "cita"."inicio")
);
--> statement-breakpoint
CREATE TABLE "clinica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"clave_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paciente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text NOT NULL,
	"email" text,
	CONSTRAINT "paciente_telefono_unico_por_clinica" UNIQUE("clinica_id","telefono")
);
--> statement-breakpoint
CREATE TABLE "profesional" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"especialidad" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinica_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"duracion_min" integer NOT NULL,
	"precio_centimos" integer NOT NULL,
	CONSTRAINT "servicio_duracion_positiva" CHECK ("servicio"."duracion_min" > 0),
	CONSTRAINT "servicio_precio_no_negativo" CHECK ("servicio"."precio_centimos" >= 0)
);
--> statement-breakpoint
ALTER TABLE "cita" ADD CONSTRAINT "cita_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cita" ADD CONSTRAINT "cita_profesional_id_profesional_id_fk" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cita" ADD CONSTRAINT "cita_servicio_id_servicio_id_fk" FOREIGN KEY ("servicio_id") REFERENCES "public"."servicio"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cita" ADD CONSTRAINT "cita_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicio" ADD CONSTRAINT "servicio_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;