-- CreateTable
CREATE TABLE "ReplySuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "chatId" INTEGER NOT NULL,
    "replyToMessageId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "AutomatedChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "chatId" INTEGER NOT NULL,
    "replyToMessageId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CheckupSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "chatId" INTEGER NOT NULL,
    "latestMessageId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ConfiguredReplySuggestionChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chatId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ConfiguredAutomatedChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chatId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ConfiguredCheckupSuggestionChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chatId" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "ReplySuggestion_replyToMessageId_idx" ON "ReplySuggestion"("replyToMessageId");

-- CreateIndex
CREATE INDEX "AutomatedChatMessage_replyToMessageId_idx" ON "AutomatedChatMessage"("replyToMessageId");

-- CreateIndex
CREATE INDEX "CheckupSuggestion_latestMessageId_idx" ON "CheckupSuggestion"("latestMessageId");
