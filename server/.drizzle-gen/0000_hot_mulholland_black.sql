CREATE TABLE "parents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"role" varchar(10) DEFAULT 'parent' NOT NULL,
	"status" varchar(10) DEFAULT 'active' NOT NULL,
	CONSTRAINT "parents_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"parent_id" bigint NOT NULL,
	"nickname" varchar(30) NOT NULL,
	"age" smallint NOT NULL,
	"daily_limit_minutes" smallint DEFAULT 30 NOT NULL,
	"avatar_url" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkin_calendar" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"calendar_date" date NOT NULL,
	"status" varchar(10) DEFAULT 'miss' NOT NULL,
	"sub_items_completed" smallint DEFAULT 0 NOT NULL,
	"garden_icon" varchar(30),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkin_records" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"checkin_date" date NOT NULL,
	"task_garden" varchar(10) DEFAULT 'pending' NOT NULL,
	"task_eat" varchar(10) DEFAULT 'pending' NOT NULL,
	"task_eat_content" varchar(100),
	"task_eat_skipped" boolean DEFAULT false NOT NULL,
	"task_eat_skip_reason" varchar(30),
	"task_sleep" varchar(10) DEFAULT 'pending' NOT NULL,
	"task_water" varchar(10) DEFAULT 'pending' NOT NULL,
	"task_sport" varchar(10) DEFAULT 'pending' NOT NULL,
	"sub_water" boolean DEFAULT false NOT NULL,
	"sub_vegetable" boolean DEFAULT false NOT NULL,
	"sub_fruit" boolean DEFAULT false NOT NULL,
	"sub_outdoor" boolean DEFAULT false NOT NULL,
	"sub_early_sleep" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"is_makeup" boolean DEFAULT false NOT NULL,
	"makeup_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stool_analyses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"checkin_id" bigint,
	"mode" varchar(15) DEFAULT 'icon_selection' NOT NULL,
	"stool_icon_type" varchar(20),
	"image_url" varchar(500),
	"bristol_type" smallint,
	"diagnosis" varchar(100),
	"task_suggestion" varchar(100),
	"api_raw_response" jsonb,
	"is_valid" boolean DEFAULT true NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_awards" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"badge_def_id" bigint NOT NULL,
	"rarity" varchar(10) DEFAULT 'bronze' NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"upgraded_at" timestamp with time zone,
	"event_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "badge_defs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(50) NOT NULL,
	"category" varchar(20) NOT NULL,
	"description" varchar(200),
	"condition_rule" jsonb NOT NULL,
	"silver_rule" jsonb,
	"gold_rule" jsonb,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "badge_defs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "garden_action_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"action_type" varchar(30) NOT NULL,
	"action_detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garden_states" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"current_state" varchar(20) DEFAULT 'healthy' NOT NULL,
	"moisture_level" smallint DEFAULT 50 NOT NULL,
	"growth_stage" smallint DEFAULT 1 NOT NULL,
	"garden_xp" integer DEFAULT 0 NOT NULL,
	"unlocked_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "garden_states_child_id_unique" UNIQUE("child_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_module_progress" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"module_code" varchar(30) NOT NULL,
	"cards_unlocked" integer DEFAULT 0 NOT NULL,
	"cards_total" integer DEFAULT 5 NOT NULL,
	"quizzes_passed" integer DEFAULT 0 NOT NULL,
	"animation_watched" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quiz_records" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"quiz_date" date NOT NULL,
	"module_code" varchar(30),
	"question_type" varchar(20) NOT NULL,
	"question" varchar(500) NOT NULL,
	"answer_correct" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_report_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"period_type" varchar(5) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"metrics" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"child_id" bigint NOT NULL,
	"friend_child_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_children_parent" ON "children" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_calendar_child_date" ON "checkin_calendar" USING btree ("child_id","calendar_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_checkin_child_date" ON "checkin_records" USING btree ("child_id","checkin_date");--> statement-breakpoint
CREATE INDEX "idx_checkin_date" ON "checkin_records" USING btree ("checkin_date");--> statement-breakpoint
CREATE INDEX "idx_stool_child" ON "stool_analyses" USING btree ("child_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_stool_checkin" ON "stool_analyses" USING btree ("checkin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_badge_child_def_rarity" ON "badge_awards" USING btree ("child_id","badge_def_id","rarity");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_badge_event" ON "badge_awards" USING btree ("event_id","badge_def_id");--> statement-breakpoint
CREATE INDEX "idx_badge_child" ON "badge_awards" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_garden_log_child_time" ON "garden_action_logs" USING btree ("child_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_garden_log_daily" ON "garden_action_logs" USING btree ("child_id","action_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_module_child" ON "knowledge_module_progress" USING btree ("child_id","module_code");--> statement-breakpoint
CREATE INDEX "idx_quiz_child_date" ON "quiz_records" USING btree ("child_id","quiz_date");--> statement-breakpoint
CREATE INDEX "idx_quiz_child" ON "quiz_records" USING btree ("child_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_report_child_period" ON "growth_report_snapshots" USING btree ("child_id","period_type","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_friendship_pair" ON "friendships" USING btree ("child_id","friend_child_id");