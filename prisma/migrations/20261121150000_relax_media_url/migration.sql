-- Release A stops writing the Media's storage columns, so the canonical address
-- this column held must become optional before the code that no longer writes
-- it is deployed. The previous container keeps writing and reading it; the next
-- release drops the column together with the other five.
ALTER TABLE "Media" ALTER COLUMN "url" DROP NOT NULL;
