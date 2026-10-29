# Vector column handling

The `knowledge_chunks.embedding` column is `vector(1024)` (pgvector).
Prisma does not generate type-safe queries for this column.

- To INSERT a chunk with embedding, use prisma.$executeRaw with `::vector` cast.
- To SEARCH, use prisma.$queryRaw with `<=>` (cosine distance) operator.

Examples in apps/api/src/chatbot/knowledge/{ingestion,retrieval}.service.ts.
