-- ============================================
-- 肠道花园（Gut Garden）— 建表 SQL
-- 版本: v2.0
-- 日期: 2026-07-30
-- 数据库: PostgreSQL 15+
-- 变更摘要:
--   v2.0 — 年龄 3-10、打卡附加子项、便便双模式、
--          花园 6 阶段、知识模块进度表、正向强化徽章
-- ============================================

-- ============================================
-- 1. 家长账号
-- ============================================
CREATE TABLE IF NOT EXISTS parents (
    id              BIGSERIAL PRIMARY KEY,
    phone           VARCHAR(20)  NOT NULL UNIQUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMP,
    status          VARCHAR(10)  NOT NULL DEFAULT 'active'
);
COMMENT ON TABLE parents IS '家长账号';
COMMENT ON COLUMN parents.phone IS '手机号';
COMMENT ON COLUMN parents.status IS 'active/disabled';

-- ============================================
-- 2. 儿童档案
-- ============================================
CREATE TABLE IF NOT EXISTS children (
    id                  BIGSERIAL PRIMARY KEY,
    parent_id           BIGINT       NOT NULL,
    nickname            VARCHAR(30)  NOT NULL,
    age                 SMALLINT     NOT NULL CHECK (age BETWEEN 3 AND 10),
    daily_limit_minutes SMALLINT     NOT NULL DEFAULT 30,
    avatar_url          VARCHAR(300),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE children IS '儿童档案（仅注册用户，游客数据存 localStorage）';
COMMENT ON COLUMN children.parent_id IS '所属家长';
COMMENT ON COLUMN children.age IS '年龄 (3-10)';
COMMENT ON COLUMN children.daily_limit_minutes IS '每日使用时长限制（分钟）';

CREATE INDEX idx_children_parent ON children(parent_id);

-- ============================================
-- 3. 每日打卡记录（含附加子项）
-- ============================================
CREATE TABLE IF NOT EXISTS checkin_records (
    id                  BIGSERIAL PRIMARY KEY,
    child_id            BIGINT       NOT NULL,
    checkin_date        DATE         NOT NULL,
    task_garden         VARCHAR(10)  NOT NULL DEFAULT 'pending',
    task_eat            VARCHAR(10)  NOT NULL DEFAULT 'pending',
    task_eat_content    VARCHAR(100),
    task_eat_skipped    BOOLEAN      NOT NULL DEFAULT FALSE,
    task_eat_skip_reason VARCHAR(30),
    task_sleep          VARCHAR(10)  NOT NULL DEFAULT 'pending',
    -- 附加子项（可选，勾选额外加分不强制）
    sub_water           BOOLEAN      NOT NULL DEFAULT FALSE,
    sub_vegetable       BOOLEAN      NOT NULL DEFAULT FALSE,
    sub_fruit           BOOLEAN      NOT NULL DEFAULT FALSE,
    sub_outdoor         BOOLEAN      NOT NULL DEFAULT FALSE,
    sub_early_sleep     BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_at        TIMESTAMP,
    is_makeup           BOOLEAN      NOT NULL DEFAULT FALSE,
    makeup_date         DATE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE checkin_records IS '每日打卡记录（3主项+5可选附加子项）';
COMMENT ON COLUMN checkin_records.task_garden IS '探索花园: pending/auto_done';
COMMENT ON COLUMN checkin_records.task_eat IS '吃好: pending/done';
COMMENT ON COLUMN checkin_records.task_eat_content IS '动态任务文案（便便分析生成）';
COMMENT ON COLUMN checkin_records.task_eat_skipped IS '家长是否跳过AI建议';
COMMENT ON COLUMN checkin_records.task_sleep IS '睡好: pending/done';
COMMENT ON COLUMN checkin_records.sub_water IS '附加子项: 喝水';
COMMENT ON COLUMN checkin_records.sub_vegetable IS '附加子项: 蔬菜';
COMMENT ON COLUMN checkin_records.sub_fruit IS '附加子项: 水果';
COMMENT ON COLUMN checkin_records.sub_outdoor IS '附加子项: 户外活动';
COMMENT ON COLUMN checkin_records.sub_early_sleep IS '附加子项: 早睡';
COMMENT ON COLUMN checkin_records.is_makeup IS '是否为补签（≤3次/月）';

CREATE UNIQUE INDEX uk_checkin_child_date ON checkin_records(child_id, checkin_date);
CREATE INDEX idx_checkin_date ON checkin_records(checkin_date);

-- ============================================
-- 4. 便便分析记录（双模式）
-- ============================================
CREATE TABLE IF NOT EXISTS stool_analyses (
    id                  BIGSERIAL PRIMARY KEY,
    child_id            BIGINT       NOT NULL,
    checkin_id          BIGINT,
    mode                VARCHAR(15)  NOT NULL DEFAULT 'icon_selection',
    stool_icon_type     VARCHAR(20),
    image_url           VARCHAR(500),
    bristol_type        SMALLINT     CHECK (bristol_type BETWEEN 1 AND 7),
    diagnosis           VARCHAR(100),
    task_suggestion     VARCHAR(100),
    api_raw_response    JSONB,
    is_valid            BOOLEAN      NOT NULL DEFAULT TRUE,
    uploaded_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP    NOT NULL DEFAULT (NOW() + INTERVAL '3 days')
);
COMMENT ON TABLE stool_analyses IS '便便分析记录（双模式: icon_selection/photo_upload）';
COMMENT ON COLUMN stool_analyses.mode IS 'icon_selection (默认图标选择) / photo_upload (拍照上传,需注册)';
COMMENT ON COLUMN stool_analyses.stool_icon_type IS '图标选择模式: Bristol类型对应图标编码';
COMMENT ON COLUMN stool_analyses.image_url IS '便便照片存储路径（仅 photo_upload 模式）';
COMMENT ON COLUMN stool_analyses.bristol_type IS '布里斯托类型 (1-7)';
COMMENT ON COLUMN stool_analyses.api_raw_response IS '第三方 API 原始响应（仅 photo_upload）';
COMMENT ON COLUMN stool_analyses.is_valid IS '是否通过粪便内容识别';
COMMENT ON COLUMN stool_analyses.expires_at IS '分析结果有效期（3天）';

CREATE INDEX idx_stool_child ON stool_analyses(child_id, uploaded_at DESC);
CREATE INDEX idx_stool_checkin ON stool_analyses(checkin_id);

-- ============================================
-- 5. 徽章定义模板
-- ============================================
CREATE TABLE IF NOT EXISTS badge_defs (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,
    name            VARCHAR(50)  NOT NULL,
    category        VARCHAR(20)  NOT NULL,
    description     VARCHAR(200),
    condition_rule  JSONB        NOT NULL,
    silver_rule     JSONB,
    gold_rule       JSONB,
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE badge_defs IS '徽章定义模板';
COMMENT ON COLUMN badge_defs.category IS 'persist/explore/learn/special';
COMMENT ON COLUMN badge_defs.condition_rule IS '获取条件规则 JSON（正向强化: streak取历史最高值）';
COMMENT ON COLUMN badge_defs.silver_rule IS '银级升级规则';
COMMENT ON COLUMN badge_defs.gold_rule IS '金级升级规则';

-- ============================================
-- 6. 用户徽章获得记录
-- ============================================
CREATE TABLE IF NOT EXISTS badge_awards (
    id              BIGSERIAL PRIMARY KEY,
    child_id        BIGINT       NOT NULL,
    badge_def_id    BIGINT       NOT NULL,
    rarity          VARCHAR(10)  NOT NULL DEFAULT 'bronze',
    awarded_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    upgraded_at     TIMESTAMP,
    event_id        VARCHAR(100)
);
COMMENT ON TABLE badge_awards IS '用户徽章获得记录';
COMMENT ON COLUMN badge_awards.rarity IS 'bronze/silver/gold';
COMMENT ON COLUMN badge_awards.event_id IS '触发行为事件ID（幂等防重）';

CREATE UNIQUE INDEX uk_badge_child_def_rarity ON badge_awards(child_id, badge_def_id, rarity);
CREATE UNIQUE INDEX uk_badge_event ON badge_awards(event_id, badge_def_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_badge_child ON badge_awards(child_id);

-- ============================================
-- 7. 花园行为日志
-- ============================================
CREATE TABLE IF NOT EXISTS garden_action_logs (
    id              BIGSERIAL PRIMARY KEY,
    child_id        BIGINT       NOT NULL,
    action_type     VARCHAR(30)  NOT NULL,
    action_detail   JSONB,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE garden_action_logs IS '花园行为日志';
COMMENT ON COLUMN garden_action_logs.action_type IS 'feed/explore/magnifier/treatment';
COMMENT ON COLUMN garden_action_logs.action_detail IS '行为详情（食物类型/点击区域等）JSON';

CREATE INDEX idx_garden_log_child_time ON garden_action_logs(child_id, created_at DESC);
CREATE INDEX idx_garden_log_daily ON garden_action_logs(child_id, (DATE(created_at)), action_type);

-- ============================================
-- 8. 花园状态（6 阶段成长主线）
-- ============================================
CREATE TABLE IF NOT EXISTS garden_states (
    id                  BIGSERIAL PRIMARY KEY,
    child_id            BIGINT       NOT NULL UNIQUE,
    current_state       VARCHAR(20)  NOT NULL DEFAULT 'healthy',
    moisture_level      SMALLINT     NOT NULL DEFAULT 50 CHECK (moisture_level BETWEEN 0 AND 100),
    growth_stage        SMALLINT     NOT NULL DEFAULT 1 CHECK (growth_stage BETWEEN 1 AND 6),
    garden_xp           INTEGER      NOT NULL DEFAULT 0,
    unlocked_features   JSONB        NOT NULL DEFAULT '[]',
    last_updated        TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE garden_states IS '花园当前状态快照';
COMMENT ON COLUMN garden_states.current_state IS 'healthy/high_sugar/dry/recovering';
COMMENT ON COLUMN garden_states.moisture_level IS '水分值 (0-100)';
COMMENT ON COLUMN garden_states.growth_stage IS '花园成长阶段: 1=种子 2=幼苗 3=成长 4=丰收 5=大师 6=终极';
COMMENT ON COLUMN garden_states.unlocked_features IS '已解锁功能列表 JSON 数组';

-- ============================================
-- 9. 知识模块学习进度（新增）
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_module_progress (
    id                  BIGSERIAL PRIMARY KEY,
    child_id            BIGINT       NOT NULL,
    module_code         VARCHAR(30)  NOT NULL,
    cards_unlocked      INTEGER      NOT NULL DEFAULT 0,
    cards_total         INTEGER      NOT NULL DEFAULT 5,
    quizzes_passed      INTEGER      NOT NULL DEFAULT 0,
    animation_watched   BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_at        TIMESTAMP
);
COMMENT ON TABLE knowledge_module_progress IS '知识模块学习进度';
COMMENT ON COLUMN knowledge_module_progress.module_code IS 'fiber_square/ferment_workshop/scfa_spring/barrier_wall/eco_station';
COMMENT ON COLUMN knowledge_module_progress.cards_unlocked IS '已解锁卡片数';
COMMENT ON COLUMN knowledge_module_progress.cards_total IS '该模块总卡片数';
COMMENT ON COLUMN knowledge_module_progress.quizzes_passed IS '通过测验数';
COMMENT ON COLUMN knowledge_module_progress.animation_watched IS '是否观看过 90s 科普动画';

CREATE UNIQUE INDEX uk_module_child ON knowledge_module_progress(child_id, module_code);

-- ============================================
-- 10. 问答记录
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_records (
    id              BIGSERIAL PRIMARY KEY,
    child_id        BIGINT       NOT NULL,
    quiz_date       DATE         NOT NULL,
    module_code     VARCHAR(30),
    question_type   VARCHAR(20)  NOT NULL,
    question        VARCHAR(500) NOT NULL,
    answer_correct  BOOLEAN      NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE quiz_records IS '问答记录';
COMMENT ON COLUMN quiz_records.module_code IS '所属知识模块';
COMMENT ON COLUMN quiz_records.question_type IS 'single_choice/pairing/ordering';

CREATE INDEX idx_quiz_child_date ON quiz_records(child_id, quiz_date);
CREATE INDEX idx_quiz_child ON quiz_records(child_id);

-- ============================================
-- 11. 成长报告快照
-- ============================================
CREATE TABLE IF NOT EXISTS growth_report_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    child_id        BIGINT       NOT NULL,
    period_type     VARCHAR(5)   NOT NULL,
    period_start    DATE         NOT NULL,
    period_end      DATE         NOT NULL,
    metrics         JSONB        NOT NULL,
    generated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE growth_report_snapshots IS '成长报告周期快照';
COMMENT ON COLUMN growth_report_snapshots.period_type IS 'week/month';
COMMENT ON COLUMN growth_report_snapshots.metrics IS '12项指标值 JSON 快照';

CREATE UNIQUE INDEX uk_report_child_period ON growth_report_snapshots(child_id, period_type, period_start);

-- ============================================
-- 12. 打卡日历缓存
-- ============================================
CREATE TABLE IF NOT EXISTS checkin_calendar (
    id                  BIGSERIAL PRIMARY KEY,
    child_id            BIGINT       NOT NULL,
    calendar_date       DATE         NOT NULL,
    status              VARCHAR(10)  NOT NULL DEFAULT 'miss',
    sub_items_completed SMALLINT     NOT NULL DEFAULT 0,
    garden_icon         VARCHAR(30),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE checkin_calendar IS '打卡日历缓存（每日凌晨批量更新）';
COMMENT ON COLUMN checkin_calendar.status IS 'done/miss/makeup';
COMMENT ON COLUMN checkin_calendar.sub_items_completed IS '完成的附加子项数 (0-5)';
COMMENT ON COLUMN checkin_calendar.garden_icon IS '当日花园状态小图标编码';

CREATE UNIQUE INDEX uk_calendar_child_date ON checkin_calendar(child_id, calendar_date);

-- ============================================
-- 种子数据：MVP 徽章定义（v2.0 — 含知识模块徽章）
-- ============================================
INSERT INTO badge_defs (code, name, category, description, condition_rule, silver_rule, gold_rule, sort_order) VALUES
('first_checkin',     '初来乍到',   'persist', '完成首次打卡',                  '{"type":"checkin_streak","threshold":1}',        NULL,                                       NULL,                                           1),
('persist_3d',        '初露锋芒',   'persist', '最高连续打卡3天',               '{"type":"checkin_streak","threshold":3}',        NULL,                                       '{"type":"checkin_streak","threshold":7}',        2),
('persist_7d',        '一周之星',   'persist', '最高连续打卡7天',               '{"type":"checkin_streak","threshold":7}',        '{"type":"checkin_streak","threshold":30}',  '{"type":"checkin_streak","threshold":100}',      3),
('persist_30d',       '月度冠军',   'persist', '最高连续打卡30天',              '{"type":"checkin_streak","threshold":30}',       NULL,                                       '{"type":"checkin_streak","threshold":100}',      4),
('persist_100d',      '百日守护',   'persist', '最高连续打卡100天',             '{"type":"checkin_streak","threshold":100}',      NULL,                                       NULL,                                           5),
('first_feed',        '初次投喂',   'explore', '完成首次食物投喂',               '{"type":"feed_total","threshold":1}',            NULL,                                       NULL,                                           6),
('feed_50',           '小小农夫',   'explore', '累计投喂50次',                  '{"type":"feed_total","threshold":50}',           '{"type":"feed_total","threshold":200}',     '{"type":"feed_total","threshold":500}',          7),
('first_magnifier',   '小小科学家', 'explore', '首次使用放大镜',                 '{"type":"magnifier_use","threshold":1}',         NULL,                                       NULL,                                           8),
('magnifier_20',      '放大镜专家', 'explore', '累计使用放大镜20次',             '{"type":"magnifier_use","threshold":20}',        '{"type":"magnifier_use","threshold":100}',   NULL,                                           9),
('garden_doctor',     '花园医生',   'explore', '完成10次花园恢复',               '{"type":"treatment_total","threshold":10}',      '{"type":"treatment_total","threshold":50}',  NULL,                                          10),
('first_quiz',        '好奇宝宝',   'learn',   '首次完成问答',                  '{"type":"quiz_correct","threshold":1}',          NULL,                                       NULL,                                          11),
('quiz_10',           '答题小能手', 'learn',   '累计答对10题',                  '{"type":"quiz_correct","threshold":10}',         '{"type":"quiz_correct","threshold":50}',    '{"type":"quiz_correct","threshold":200}',       12),
('first_stool',       '便便观察员', 'learn',   '首次便便记录',                  '{"type":"stool_first"}',                        NULL,                                       NULL,                                          13),
('stool_streak_7',    '持续观察',   'learn',   '连续7天便便记录',               '{"type":"stool_streak","threshold":7}',          '{"type":"stool_streak","threshold":30}',    NULL,                                          14),
('type4_streak_5',    '超级便便',   'special', '连续5次布里斯托Type 4',         '{"type":"bristol_type4_streak","threshold":5}',  '{"type":"bristol_type4_streak","threshold":15}', NULL,                                     15),
('perfect_week',      '完美一周',   'special', '一周7天全勤',                   '{"type":"perfect_week"}',                        '{"type":"perfect_week","weeks":4}',          NULL,                                          16),
('all_sub_7d',        '全能小冠军', 'special', '连续7天完成全部附加子项',        '{"type":"all_sub_items","threshold":7}',         '{"type":"all_sub_items","threshold":21}',    NULL,                                          17),
('module_fiber',      '纤维专家',   'learn',   '完成膳食纤维广场模块',           '{"type":"module_completed","module_code":"fiber_square"}', NULL,                            NULL,                                          18),
('module_all_5',      '知识全能王', 'learn',   '完成全部5个知识模块',            '{"type":"module_completed","module_code":"all"}', NULL,                                     NULL,                                          19),
('birthday',          '花园生日',   'special', '儿童生日当天登录',               '{"type":"birthday"}',                           NULL,                                       NULL,                                          20),
('spring_festival',   '春节彩蛋',   'special', '春节期间登录',                   '{"type":"holiday","holiday":"spring_festival"}', NULL,                                       NULL,                                          21)
ON CONFLICT (code) DO NOTHING;
