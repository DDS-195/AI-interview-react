-- 学习版RAG：原文与切片两张表，向量直接保存在切片中。
CREATE TABLE IF NOT EXISTS rag_documents (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  sourceKey CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  sourceUrl VARCHAR(1000) NOT NULL,
  sourceKind VARCHAR(20) NOT NULL,
  rawText MEDIUMTEXT NOT NULL,
  metadata JSON NOT NULL,
  contentHash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  versionId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  revision INT UNSIGNED NOT NULL,
  updatedAt DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS rag_chunks (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  documentId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  headingPath VARCHAR(500) NOT NULL,
  text MEDIUMTEXT NOT NULL,
  contentHash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  embedding JSON,
  embeddingProfile CHAR(64) CHARACTER SET ascii COLLATE ascii_bin,
  UNIQUE KEY rag_sequence (documentId,sequence),
  CONSTRAINT rag_chunk_document_fk FOREIGN KEY (documentId) REFERENCES rag_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
