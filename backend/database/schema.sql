-- MySQL 8.0+。业务ID和原时间字符串保留，rowId与UTC时间列用于稳定排序。
CREATE TABLE IF NOT EXISTS questions (
  rowId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(200) COLLATE utf8mb4_bin NOT NULL,
  categoryId VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  title VARCHAR(2000) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  difficulty VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL,
  details JSON NOT NULL,
  titleKey CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  contentKey CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  topic VARCHAR(300) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(details, '$.topic'))) STORED,
  UNIQUE KEY question_id (id),
  KEY question_category (categoryId, rowId),
  KEY question_title_key (categoryId, titleKey),
  KEY question_content_key (categoryId, contentKey),
  KEY question_topic (categoryId, topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS favorites (
  rowId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  questionId VARCHAR(200) COLLATE utf8mb4_bin NOT NULL,
  addedAt VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  addedOrderAt DATETIME(3) NOT NULL,
  UNIQUE KEY favorite_question (questionId),
  KEY favorites_date (addedOrderAt, rowId),
  CONSTRAINT favorite_question_fk FOREIGN KEY (questionId) REFERENCES questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS history (
  rowId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  submittedAt VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  submittedOrderAt DATETIME(3) NOT NULL,
  questionId VARCHAR(200) COLLATE utf8mb4_bin NOT NULL,
  answer MEDIUMTEXT NOT NULL,
  score DOUBLE,
  correctAnswer MEDIUMTEXT,
  feedback MEDIUMTEXT,
  details JSON NOT NULL,
  UNIQUE KEY history_submission (submittedAt),
  KEY history_date (submittedOrderAt, rowId),
  KEY history_question (questionId),
  CONSTRAINT history_question_fk FOREIGN KEY (questionId) REFERENCES questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS metadata (
  name VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  value VARCHAR(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 生成时按分类锁定，避免不同连接同时通过题目查重。
CREATE TABLE IF NOT EXISTS generation_locks (
  categoryId VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 复习标记只保存人工决定；成绩、失分点与进步始终从历史记录计算。
CREATE TABLE IF NOT EXISTS review_marks (
  questionId VARCHAR(200) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  status VARCHAR(10) NOT NULL,
  baselineSubmission VARCHAR(100) COLLATE utf8mb4_bin,
  updatedAt DATETIME(3) NOT NULL,
  CONSTRAINT review_question_fk FOREIGN KEY (questionId) REFERENCES questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
