-- DropIndex
DROP INDEX "Connection_fromNodeId_idx";

-- CreateIndex
-- Rejects identical fan-out edges (same source, output port, target, input
-- port): a duplicate edge would double the token arrival (one Step per
-- arriving token). The unique's leftmost prefix keeps serving fromNodeId
-- lookups, which makes "Connection_fromNodeId_idx" redundant.
CREATE UNIQUE INDEX "Connection_fromNodeId_toNodeId_fromOutput_toInput_key" ON "Connection"("fromNodeId", "toNodeId", "fromOutput", "toInput");